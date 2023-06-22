import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Container, Form, Modal, OverlayTrigger, Popover, Row, Table } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { constrainedPage, del, err, get, post, titleCase, today } from "../util/util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faPlus, faCartPlus, faFilter } from '@fortawesome/free-solid-svg-icons';
import { Pagination } from "./Pagination";

enum TransactionType {
    BALANCE = "BALANCE",
    TRANSFER = "TRANSFER",
}

interface JTranscation {
    id: string,
    description: string,
    date: string,
    value: number,
    type: TransactionType,
    accountId: string,
    fromAccountId: string,
}

interface WorkingTransaction {
    id: string,
    description: string,
    date: string,
    value: string,
    type: TransactionType,
    accountId: string,
    fromAccountId: string,
}

interface BulkWorkingTransactions {
    description: string,
    date: string,
    type: TransactionType,
    fromAccountId?: string,
    transactions: {
        accountId: string,
        value?: string,
    }[]
}

function AccountName({ accountId: fromAccountId, accounts }: { accountId: string, accounts: IndexedAccounts }) {
    if (fromAccountId === undefined || fromAccountId === null) {
        return (<React.Fragment />);
    }
    const account = accounts[fromAccountId];
    if (account == undefined || account === null) {
        return <React.Fragment>ERRROR</React.Fragment>
    }
    return (<React.Fragment>{account.name} ({titleCase(account.type)})</React.Fragment>);
}

function description(transaction: JTranscation) {
    return transaction.description === "" ? titleCase(transaction.type) : transaction.description;
}

function Transaction({ transaction, accounts, edit, del }: { transaction: JTranscation, accounts: IndexedAccounts, edit: () => void, del: () => void }) {
    return (
        <tr>
            <td>{titleCase(transaction.type)}</td>
            <td>{description(transaction)}</td>
            <td>{transaction.date}</td>
            <td>{transaction.value}</td>
            <td><AccountName accountId={transaction.accountId} accounts={accounts} /></td>
            <td><AccountName accountId={transaction.fromAccountId} accounts={accounts} /></td>
            <td>
                <ButtonGroup>
                    <Button onClick={() => edit()}>
                        <FontAwesomeIcon title="Edit" icon={faPenToSquare} />
                    </Button>
                    <Button variant="danger" onClick={() => del()}>
                        <FontAwesomeIcon title="Delete" icon={faTrash} />
                    </Button>
                </ButtonGroup>
            </td>
        </tr>
    );
}

function TransactionModal({
    accounts,
    singleAccount,
    show,
    setShow,
    transaction,
    setTransaction,
    saving,
    save
}: {
    accounts: IndexedAccounts,
    singleAccount: boolean,
    show: boolean,
    setShow: (value: boolean) => void,
    transaction: Partial<WorkingTransaction>,
    setTransaction: (transaction: Partial<WorkingTransaction>) => void,
    saving: boolean,
    save: () => void
}) {
    const isAdd = transaction.id === undefined;
    return (
        <Modal show={show} onHide={() => setShow(false)} >
            <Modal.Header closeButton>
                <Modal.Title>{isAdd ? "Add" : "Edit"} Transaction</Modal.Title>
            </Modal.Header>
            <Form>
                <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control type="text" value={transaction?.description} onChange={e => setTransaction({ ...transaction, description: e.target.value })}></Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" value={transaction?.date} onChange={e => setTransaction({ ...transaction, date: e.target.value })}></Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Value</Form.Label>
                    <Form.Control type="text" value={transaction?.value} onChange={e => setTransaction({ ...transaction, value: e.target.value })}></Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select disabled={!isAdd} value={transaction.type} onChange={e => {
                        const type = e.target.value as TransactionType;
                        const fromAccountId = type === TransactionType.TRANSFER ? Object.keys(accounts)[0] : undefined;
                        setTransaction({ ...transaction, fromAccountId, type });
                    }}>
                        {Object.keys(TransactionType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Account</Form.Label>
                    <Form.Select disabled={!isAdd || singleAccount} value={transaction?.accountId} onChange={e => setTransaction({ ...transaction, accountId: e.target.value })}>
                        {Object.values(accounts).map(account => <option key={account.id} value={account.id}>{account.name} ({titleCase(account.type)})</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group hidden={transaction.type !== TransactionType.TRANSFER}>
                    <Form.Label>From Account</Form.Label>
                    <Form.Select disabled={!isAdd || transaction.type !== TransactionType.TRANSFER} value={transaction?.fromAccountId} onChange={e => setTransaction({ ...transaction, fromAccountId: e.target.value })}>
                        {Object.values(accounts).map(account => <option key={account.id} value={account.id}>{account.name} ({titleCase(account.type)})</option>)}
                    </Form.Select>
                </Form.Group>
            </Form>
            <Modal.Footer>
                <Button disabled={saving} variant="secondary" onClick={() => setShow(false)}>
                    Cancel
                </Button>
                <Button disabled={saving} variant="primary" onClick={() => save()}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

function BulkTransactionModal({
    accounts,
    show,
    setShow,
    transactions,
    setTransactions,
    saving,
    save
}: {
    accounts: IndexedAccounts,
    show: boolean,
    setShow: (value: boolean) => void,
    transactions: BulkWorkingTransactions,
    setTransactions: (transactions: BulkWorkingTransactions) => void,
    saving: boolean,
    save: () => void
}) {
    function editTransaction(index: number, update: Partial<{ accountId: string, value: string }>) {
        const updatedTransactions = [...transactions.transactions];
        updatedTransactions[index] = {
            ...updatedTransactions[index],
            ...update
        }
        setTransactions({ ...transactions, transactions: updatedTransactions })
    }

    function deleteTransaction(index: number) {
        const updatedTransactions = [...transactions.transactions];
        updatedTransactions.splice(index, 1);
        setTransactions({ ...transactions, transactions: updatedTransactions })
    }

    return (
        <Modal show={show} onHide={() => setShow(false)} >
            <Modal.Header closeButton>
                <Modal.Title>Add Multiple Transactions</Modal.Title>
            </Modal.Header>
            <Form>
                <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control type="text" value={transactions?.description} onChange={e => setTransactions({ ...transactions, description: e.target.value })}></Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" value={transactions?.date} onChange={e => setTransactions({ ...transactions, date: e.target.value })}></Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select value={transactions.type} onChange={e => {
                        const type = e.target.value as TransactionType;
                        const fromAccountId = type === TransactionType.TRANSFER ? Object.keys(accounts)[0] : undefined;
                        setTransactions({ ...transactions, fromAccountId, type });
                    }}>
                        {Object.keys(TransactionType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group hidden={transactions.type !== TransactionType.TRANSFER}>
                    <Form.Label>From Account</Form.Label>
                    <Form.Select disabled={transactions.type !== TransactionType.TRANSFER} value={transactions.fromAccountId} onChange={e => setTransactions({ ...transactions, fromAccountId: e.target.value })}>
                        {Object.values(accounts).map(account => <option key={account.id} value={account.id}>{account.name} ({titleCase(account.type)})</option>)}
                    </Form.Select>
                </Form.Group>
                {(transactions.transactions).map((transaction, index) => {
                    return (
                        <React.Fragment key={index}>
                            <Form.Group>
                                <Form.Label>Value</Form.Label>
                                <Form.Control type="text" value={transaction.value} onChange={e => editTransaction(index, { value: e.target.value })}></Form.Control>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Account</Form.Label>
                                <Form.Select value={transaction?.accountId} onChange={e => editTransaction(index, { accountId: e.target.value })}>
                                    {Object.values(accounts).map(account => <option key={account.id} value={account.id}>{account.name} ({titleCase(account.type)})</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Delete Transaction</Form.Label>
                                <Form.Group>
                                    <Button variant="danger" onClick={() => deleteTransaction(index)}>
                                        Delete Transaction
                                    </Button>
                                </Form.Group>
                            </Form.Group>
                        </React.Fragment>
                    );
                })}
                <Form.Group>
                    <Form.Label>Add Transaction</Form.Label>
                    <Form.Group>
                        <Button onClick={() => setTransactions({ ...transactions, transactions: transactions.transactions.concat({ accountId: Object.values(accounts)[0].id }) })}>
                            Add Transaction
                        </Button>
                    </Form.Group>
                </Form.Group>
            </Form>
            <Modal.Footer>
                <Button disabled={saving} variant="secondary" onClick={() => setShow(false)}>
                    Cancel
                </Button>
                <Button disabled={saving} variant="primary" onClick={() => save()}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export function Transactions() {
    const { accountId } = useParams();

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const [pageSize, setPageSize] = useState(10);
    const [page, _setPage] = useState(0);

    const [transactionTypeFilter, setTransactionTypeFilter] = useState<"none" | TransactionType>("none");
    const [descriptionFilter, setDescriptionFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const [transactions, setTransactions] = useState<JTranscation[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<JTranscation[]>([]);

    const [showAdding, setShowAdding] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingTransaction, setAddingTransaction] = useState<Partial<WorkingTransaction>>({});

    const [showBulkAdding, setShowBulkAdding] = useState(false);
    const [bulkAdding, setBulkAdding] = useState(false);
    const [bulkAddingTransactions, setBulkAddingTransactions] = useState<BulkWorkingTransactions>(bulkTranscationsDefault());

    const [showEditing, setShowEditing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<WorkingTransaction>>({});

    function bulkTranscationsDefault() {
        return {
            description: "",
            date: today(),
            type: TransactionType.TRANSFER,
            transactions: []
        }
    }

    function refreshTransactions() {
        function sortTransactions(transactions: JTranscation[]) {
            return transactions.sort((left, right) => {
                const date = Date.parse(right.date) - Date.parse(left.date);
                if (date !== 0) {
                    return date;
                }
                if (left.type !== right.type) {
                    if (right.type === TransactionType.BALANCE) {
                        return 1;
                    } else {
                        return -1;
                    }
                }
                if (left.value !== right.value) {
                    return right.value - left.value;
                }
                if (left.description !== right.description) {
                    return left.description.localeCompare(right.description);
                }
                return left.accountId.localeCompare(right.accountId);
            });
        }

        if (accountId !== undefined) {
            get<JTranscation[]>(server, `/api/account/${accountId}/transaction/`)
                .then(transactions => setTransactions(sortTransactions(transactions)))
                .catch(error => err(error));
        } else {
            get<JTranscation[]>(server, `/api/transaction/`)
                .then(transactions => setTransactions(sortTransactions(transactions)))
                .catch(error => err(error));
        }
    }

    function transactionsToDisplay() {
        if (pageSize === 0) {
            return filteredTransactions;
        }
        return filteredTransactions.slice(pageSize * page, pageSize * page + pageSize);
    }

    function setPage(newPage: number) {
        const constrained = constrainedPage(filteredTransactions.length, pageSize, newPage);
        _setPage(constrained);
    }

    useEffect(() => refreshTransactions(), []);

    useEffect(() => {
        let filtered = transactions;
        if (transactionTypeFilter !== "none") {
            filtered = filtered.filter(transaction => transaction.type === transactionTypeFilter);
        }
        if (descriptionFilter !== "") {
            const filter = descriptionFilter.toUpperCase();
            filtered = filtered.filter(transaction => description(transaction).toUpperCase().includes(filter));
        }
        if (dateFilter !== "") {
            const filter = new Date(dateFilter + "T00:00:00").getTime();
            filtered = filtered.filter(transaction => new Date(transaction.date + "T00:00:00").getTime() === filter);
        }
        setFilteredTransactions(filtered);
    }, [transactions, transactionTypeFilter, descriptionFilter, dateFilter]);

    const transactionTypeFilterPopover = (
        <Popover>
            <Popover.Body>
                <Form.Select value={transactionTypeFilter} onChange={e => setTransactionTypeFilter(e.target.value as any)}>
                    <option value={"none"}></option>
                    {Object.keys(TransactionType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                </Form.Select>
            </Popover.Body>
        </Popover>
    );

    const descriptionFilterPopover = (
        <Popover>
            <Popover.Body>
                <Form.Control value={descriptionFilter} onChange={e => setDescriptionFilter(e.target.value)}/>
            </Popover.Body>
        </Popover>
    );

    const dateFilterPopover = (
        <Popover>
            <Popover.Body>
                <Form.Control type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}/>
            </Popover.Body>
        </Popover>
    );

    return (
        <Container>
            <Row xl={1}>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Type  <OverlayTrigger trigger="click" placement="bottom" overlay={transactionTypeFilterPopover}><FontAwesomeIcon icon={faFilter} /></OverlayTrigger></th>
                            <th>Description <OverlayTrigger trigger="click" placement="bottom" overlay={descriptionFilterPopover}><FontAwesomeIcon icon={faFilter} /></OverlayTrigger></th>
                            <th>Date <OverlayTrigger trigger="click" placement="bottom" overlay={dateFilterPopover}><FontAwesomeIcon icon={faFilter} /></OverlayTrigger></th>
                            <th>Value</th>
                            <th>Account</th>
                            <th>From</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactionsToDisplay().map(transaction => <Transaction key={transaction.id} transaction={transaction} accounts={accounts} edit={() => {
                            setEditingTransaction({ ...transaction, value: transaction.value.toString() });
                            setShowEditing(true);
                        }} del={() => {
                            if (confirm(`Are you sure you want to delete ${transaction.id}?`)) {
                                del(server, `/api/account/${transaction.accountId}/transaction/${transaction.id}/`)
                                    .then(() => refreshTransactions())
                                    .catch(error => err(error));
                            }
                        }} />)}
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>
                                <ButtonGroup>
                                    <Button variant="primary" onClick={() => {
                                        setBulkAddingTransactions(bulkTranscationsDefault());
                                        setShowBulkAdding(true);
                                    }}>
                                        <FontAwesomeIcon icon={faCartPlus} />
                                    </Button>
                                    <Button variant="success" onClick={() => {
                                        setAddingTransaction({ type: TransactionType.BALANCE, description: "", date: today(), accountId: accountId ?? Object.keys(accounts)[0] });
                                        setShowAdding(true);
                                    }}>
                                        <FontAwesomeIcon icon={faPlus} />
                                    </Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </Row>
            <Pagination itemCount={transactions.length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
            <TransactionModal accounts={accounts} singleAccount={accountId !== undefined} show={showAdding} setShow={setShowAdding} transaction={addingTransaction} setTransaction={setAddingTransaction} saving={adding} save={() => {
                setAdding(true);
                post(server, `/api/account/${addingTransaction.accountId}/transaction/`, addingTransaction)
                    .then(() => refreshTransactions())
                    .catch(error => err(error))
                    .finally(() => {
                        setAdding(false);
                        setShowAdding(false);
                    });
            }} />
            <TransactionModal accounts={accounts} singleAccount={accountId !== undefined} show={showEditing} setShow={setShowEditing} transaction={editingTransaction} setTransaction={setEditingTransaction} saving={editing} save={() => {
                setEditing(true);
                post(server, `/api/account/${editingTransaction.accountId}/transaction/${editingTransaction.id}/`, editingTransaction)
                    .then(() => refreshTransactions())
                    .catch(error => err(error))
                    .finally(() => {
                        setEditing(false);
                        setShowEditing(false);
                    });
            }} />
            <BulkTransactionModal accounts={accounts} show={showBulkAdding} setShow={setShowBulkAdding} transactions={bulkAddingTransactions} setTransactions={setBulkAddingTransactions} saving={bulkAdding} save={() => {
                setBulkAdding(true);
                Promise.all(bulkAddingTransactions.transactions.map(transaction => post(server, `/api/account/${transaction.accountId}/transaction/`, {
                    ...bulkAddingTransactions,
                    ...transaction
                }))).then(() => refreshTransactions())
                    .catch(error => err(error))
                    .finally(() => {
                        setBulkAdding(false);
                        setShowBulkAdding(false);
                    });
            }} />
        </Container >
    );
}
