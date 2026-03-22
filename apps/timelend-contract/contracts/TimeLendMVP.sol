// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimeLendMVP {
    enum Status {
        Active,
        Passed,
        Failed
    }

    struct Commitment {
        address user;
        address penaltyReceiver;
        uint256 stake;
        uint64 createdAt;
        uint64 deadline;
        Status status;
        string taskDescription;
    }

    address public immutable defaultPenaltyReceiver;
    address public immutable resolver;
    uint256 public nextCommitmentId;
    mapping(uint256 => Commitment) private commitments;

    error InvalidValue();
    error InvalidDeadline();
    error InvalidTaskDescription();
    error CommitmentNotFound();
    error NotAuthorized();
    error InvalidStatus();
    error TransferFailed();
    error ZeroAddress();

    event CommitmentCreated(
        uint256 indexed commitmentId,
        address indexed user,
        address penaltyReceiver,
        uint256 stake,
        uint64 deadline,
        string taskDescription
    );

    event CommitmentResolved(
        uint256 indexed commitmentId,
        bool passed,
        address indexed recipient,
        uint256 amount
    );

    modifier onlyResolver() {
        if (msg.sender != resolver) revert NotAuthorized();
        _;
    }

    constructor(address penaltyReceiver) {
        if (penaltyReceiver == address(0)) revert ZeroAddress();

        defaultPenaltyReceiver = penaltyReceiver;
        resolver = msg.sender;
    }

    function createCommitment(uint64 durationSeconds, string calldata taskDescription)
        external
        payable
        returns (uint256 commitmentId)
    {
        if (msg.value == 0) revert InvalidValue();
        if (durationSeconds == 0) revert InvalidDeadline();
        if (bytes(taskDescription).length == 0) revert InvalidTaskDescription();

        uint64 deadline = uint64(block.timestamp + durationSeconds);

        commitmentId = nextCommitmentId++;

        commitments[commitmentId] = Commitment({
            user: msg.sender,
            penaltyReceiver: defaultPenaltyReceiver,
            stake: msg.value,
            createdAt: uint64(block.timestamp),
            deadline: deadline,
            status: Status.Active,
            taskDescription: taskDescription
        });

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            defaultPenaltyReceiver,
            msg.value,
            deadline,
            taskDescription
        );
    }

    function resolveCommitment(uint256 commitmentId, bool passed)
        external
        onlyResolver
    {
        Commitment storage c = commitments[commitmentId];

        if (c.user == address(0)) revert CommitmentNotFound();
        if (c.status != Status.Active) revert InvalidStatus();

        uint256 amount = c.stake;
        c.stake = 0;
        address recipient = passed ? c.user : c.penaltyReceiver;
        c.status = passed ? Status.Passed : Status.Failed;

        (bool ok, ) = payable(recipient).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit CommitmentResolved(commitmentId, passed, recipient, amount);
    }

    function getCommitment(uint256 commitmentId)
        external
        view
        returns (Commitment memory)
    {
        return commitments[commitmentId];
    }
}
