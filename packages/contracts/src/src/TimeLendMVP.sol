// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimeLendMVP {
    enum Status {
        Active,
        Succeeded,
        Failed,
        ClaimedByUser,
        ClaimedByPenalty
    }

    struct Commitment {
        address user;
        address verifier;
        address penaltyReceiver;
        uint256 stake;
        uint64 createdAt;
        uint64 deadline;
        Status status;
        string taskURI;
        string proofURI;
    }

    uint256 public nextCommitmentId;
    mapping(uint256 => Commitment) public commitments;

    error InvalidValue();
    error InvalidDeadline();
    error NotAuthorized();
    error InvalidStatus();
    error DeadlineNotReached();
    error DeadlineReached();
    error NoProofSubmitted();
    error TransferFailed();

    event CommitmentCreated(
        uint256 indexed commitmentId,
        address indexed user,
        address indexed verifier,
        address penaltyReceiver,
        uint256 stake,
        uint64 deadline,
        string taskURI
    );

    event ProofSubmitted(
        uint256 indexed commitmentId,
        string proofURI
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

    modifier onlyUser(uint256 commitmentId) {
        if (msg.sender != commitments[commitmentId].user) revert NotAuthorized();
        _;
    }

    modifier onlyVerifier(uint256 commitmentId) {
        if (msg.sender != commitments[commitmentId].verifier) revert NotAuthorized();
        _;
    }

    function createCommitment(
        uint64 durationSeconds,
        address verifier,
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
            penaltyReceiver: penaltyReceiver,
            stake: msg.value,
            createdAt: uint64(block.timestamp),
            deadline: uint64(block.timestamp + durationSeconds),
            status: Status.Active,
            taskURI: taskURI,
            proofURI: ""
        });

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            verifier,
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

    function verifySuccess(uint256 commitmentId)
        external
        onlyVerifier(commitmentId)
    {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.Active) revert InvalidStatus();
        if (block.timestamp > c.deadline) revert DeadlineReached();
        if (bytes(c.proofURI).length == 0) revert NoProofSubmitted();

        c.status = Status.Succeeded;

        emit CommitmentSucceeded(commitmentId, msg.sender);
    }

    function markFailed(uint256 commitmentId) external {
        Commitment storage c = commitments[commitmentId];

        if (c.status != Status.Active) revert InvalidStatus();

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

        if (msg.sender != c.penaltyReceiver) revert NotAuthorized();
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
}
