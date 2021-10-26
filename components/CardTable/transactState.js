class TransactState {
  constructor(name) {
    this.name = name;
  }

  initial() { // No transactions are currently being requested or processed.
    return this === TransactState.INITIAL;
  }

  requesting() { // MetaMask is asking the user to approve or reject one or more transactions.
    return this === TransactState.REQUESTING;
  }

  processing() { // At least one transaction is currently being processed (has precedence over REQUESTING).
    return this === TransactState.PROCESSING;
  }

  anySucceeded() { // All transactions have resolved and >= 1 of them went through.
    return this === TransactState.ANY_SUCCEEDED;
  }

  allFailed() { // All transactions have resolved and all of them threw an error.
    return this === TransactState.ALL_FAILED;
  }

  allCancelled() { // The user rejected all of the transaction requests before they were sent.
    return this === TransactState.ALL_CANCELLED;
  }
}

TransactState.INITIAL = new TransactState("INITIAL");
TransactState.REQUESTING = new TransactState("REQUESTING");
TransactState.PROCESSING = new TransactState("PROCESSING");
TransactState.ANY_SUCCEEDED = new TransactState("ANY_SUCCEEDED");
TransactState.ALL_FAILED = new TransactState("ALL_FAILED");
TransactState.ALL_CANCELLED = new TransactState("ALL_CANCELLED");

export default TransactState;
