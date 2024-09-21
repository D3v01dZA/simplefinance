CREATE TABLE account (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    CONSTRAINT PK_ACCOUNT PRIMARY KEY (id)
);

CREATE TABLE account_transaction (
    id TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    value TEXT NOT NULL,
    account_id TEXT NOT NULL,
    from_account_id TEXT,
    CONSTRAINT PK_ACCOUNT_TRANSACTION PRIMARY KEY (id),
    CONSTRAINT fk_transaction_from_account_id_to_account FOREIGN KEY (from_account_id) REFERENCES account(id),
    CONSTRAINT fk_transaction_account_id_from_account FOREIGN KEY (account_id) REFERENCES account(id)
);

CREATE TABLE setting (
    id TEXT NOT NULL,
    "key" TEXT NOT NULL,
    value TEXT NOT NULL,
    CONSTRAINT PK_SETTING PRIMARY KEY (id)
);
