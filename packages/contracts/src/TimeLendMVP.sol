// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimeLendMVP {
    enum Status {
        Active,
        PendingVerification,
        Succeeded,
        Failed,
        ClaimedByUser,
        ClaimedByPenalty
    }

    struct Commitment {
        address user;
        address verifier;
        address auditor;
        address penaltyReceiver;
        uint256 stake;
        uint64 createdAt;
        uint64 deadline;
        Status status;
        uint8 qualityScore;
        string taskURI;
        string proofURI;
        string verificationNotes;
    }

    uint256 public nextCommitmentId;
    address public admin;
    address public burnAddress;
    mapping(uint256 => Commitment) public commitments;

    error InvalidValue();
    error InvalidDeadline();
    error NotAuthorized();
    error InvalidStatus();
    error DeadlineNotReached();
    error DeadlineReached();
    error NoProofSubmitted();
    error TransferFailed();
    error InsufficientQualityScore();
    error QualityScoreTooHigh();

    event CommitmentCreated(
        uint256 indexed commitmentId,
        address indexed user,
        address indexed verifier,
        address auditor,
        address penaltyReceiver,
        uint256 stake,
        uint64 deadline,
        string taskURI
    );

    event ProofSubmitted(
        uint256 indexed commitmentId,
        string proofURI
    );

    event VerificationRequested(
        uint256 indexed commitmentId
    );

    event CommitmentVerified(
        uint256 indexed commitmentId,
        uint8 qualityScore,
        address indexed auditor
    );

    event CommitmentSucceeded(
        uint256 indexed commitmentId,
        address indexed verifier
    );

    event CommitmentFailed(
        uint256 indexed commitmentId,
        address indexed resolver
    );

    event UserClaimed(
        uint256 indexed commitmentId,
        address indexed user,
        uint256 amount
    );

    event PenaltyClaimed(
        uint256 indexed commitmentId,
        address indexed penaltyReceiver,
        uint256 amount
    );

    constructor(address _burnAddress) {
        admin = msg.sender;
        burnAddress = _burnAddress;
    }

    modifier onlyUser(uint256 commitmentId) {
        if (msg.sender != commitments[commitmentId].user) revert NotAuthorized();
        _;
    }

    modifier onlyVerifier(uint256 commitmentId) {
        if (msg.sender != commitments[commitmentId].verifier) revert NotAuthorized();
        _;
    }

    modifier onlyAuditor() {
        if (msg.sender != admin && msg.sender != commitments[nextCommitmentId - 1].auditor) revert NotAuthorized();
        _;
    }

    function createCommitment(
        uint64 durationSeconds,
        address verifier,
        address auditor,
        address penaltyReceiver,
        string calldata taskURI
    ) external payable returns (uint256 commitmentId) {
        if (msg.value == 0) revert InvalidValue();
        if (durationSeconds == 0) revert InvalidDeadline();
        if (verifier == address(0)) revert NotAuthorized();
        if (penaltyReceiver == address(0)) revert NotAuthorized();

        commitmentId = nextCommitmentId++;

        commitments[commitmentId] = Commitment({
            user: msg.sender,
            verifier: verifier,
            auditor: auditor,
            penaltyReceiver: penaltyReceiver,
            stake: msg.value,
            createdAt: uint64(block.timestamp),
            deadline: uint64(block.timestamp + durationSeconds),
            status: Status.Active,
            qualityScore: 0,
            taskURI: taskURI,
            proofURI: "",
            verificationNotes: ""
        });

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            verifier,
            auditor,
            penaltyReceiver,
            msg.value,
            uint64(block.timestamp + durationSeconds),
            taskURI
        );
    }

    function submitProof(
        uint256 commitmentId,
        string calldata proofURI
    ) external onlyUser(commitmentId) {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.Active) revert InvalidStatus();
        if (block.timestamp > c.deadline) revert DeadlineReached();

        c.proofURI = proofURI;

        emit ProofSubmitted(commitmentId, proofURI);
    }

    function requestVerification(uint256 commitmentId)
        external
        onlyVerifier(commitmentId)
    {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.Active) revert InvalidStatus();
        if (block.timestamp > c.deadline) revert DeadlineReached();
        if (bytes(c.proofURI).length == 0) revert NoProofSubmitted();

        c.status = Status.PendingVerification;

        emit VerificationRequested(commitmentId);
    }

    function verifyWithAI(
        uint256 commitmentId,
        uint8 qualityScore,
        string calldata verificationNotes
    ) external onlyAuditor {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.PendingVerification) revert InvalidStatus();
        if (qualityScore > 100) revert QualityScoreTooHigh();

        c.qualityScore = qualityScore;
        c.verificationNotes = verificationNotes;

        emit CommitmentVerified(commitmentId, qualityScore, msg.sender);
    }

    function confirmSuccess(uint256 commitmentId, uint8 minQualityScore)
        external
        onlyVerifier(commitmentId)
    {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.PendingVerification && c.status != Status.Active) revert InvalidStatus();
        
        if (c.qualityScore < minQualityScore) {
            c.status = Status.Failed;
            emit CommitmentFailed(commitmentId, msg.sender);
        } else {
            c.status = Status.Succeeded;
            emit CommitmentSucceeded(commitmentId, msg.sender);
        }
    }

    function verifySuccess(uint256 commitmentId)
        external
        onlyVerifier(commitmentId)
    {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.Active && c.status != Status.PendingVerification) revert InvalidStatus();
        if (block.timestamp > c.deadline && c.status == Status.Active) revert DeadlineReached();
        if (bytes(c.proofURI).length == 0 && c.status == Status.Active) revert NoProofSubmitted();

        c.status = Status.Succeeded;

        emit CommitmentSucceeded(commitmentId, msg.sender);
    }

    function markFailed(uint256 commitmentId) external {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.Active && c.status != Status.PendingVerification) revert InvalidStatus();

        bool verifierCallingBeforeDeadline =
            msg.sender == c.verifier && block.timestamp <= c.deadline;

        bool anyoneCallingAfterDeadline =
            block.timestamp > c.deadline;

        if (!verifierCallingBeforeDeadline && !anyoneCallingAfterDeadline) {
            revert NotAuthorized();
        }

        c.status = Status.Failed;

        emit CommitmentFailed(commitmentId, msg.sender);
    }

    function claimSuccess(uint256 commitmentId)
        external
        onlyUser(commitmentId)
    {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.Succeeded) revert InvalidStatus();

        uint256 amount = c.stake;
        c.stake = 0;
        c.status = Status.ClaimedByUser;

        (bool ok, ) = payable(c.user).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit UserClaimed(commitmentId, c.user, amount);
    }

    function claimPenalty(uint256 commitmentId) external {
        Commitment storage c = commitments[commitmentId];

        if (msg.sender != c.penaltyReceiver && msg.sender != burnAddress) revert NotAuthorized();
        if (c.status != Status.Failed) revert InvalidStatus();

        uint256 amount = c.stake;
        c.stake = 0;
        c.status = Status.ClaimedByPenalty;

        (bool ok, ) = payable(c.penaltyReceiver).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit PenaltyClaimed(commitmentId, c.penaltyReceiver, amount);
    }

    function getCommitment(uint256 commitmentId)
        external
        view
        returns (Commitment memory)
    {
        return commitments[commitmentId];
    }

    function setBurnAddress(address _burnAddress) external {
        if (msg.sender != admin) revert NotAuthorized();
        burnAddress = _burnAddress;
    }
}
