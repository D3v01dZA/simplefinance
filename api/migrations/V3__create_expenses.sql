CREATE TABLE expense (
    id TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    value TEXT NOT NULL,
    CONSTRAINT PK_EXPENSE PRIMARY KEY (id)
);
