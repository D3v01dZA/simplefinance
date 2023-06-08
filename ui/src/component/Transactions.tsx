import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Container, Form, Modal, Table } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { del, err, get, post, titleCase, today } from "../util/util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

enum TransactionType {
    BALANCE = "BALANCE",
    ADDITION = "ADDITION",
    SUBTRACTION = "SUBTRACTION",
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

function Transaction({ transaction, accounts, edit, del }: { transaction: JTranscation, accounts: IndexedAccounts, edit: () => void, del: () => void }) {
    return (
        <tr>
            <td>{titleCase(transaction.type)}</td>
            <td>{transaction.description === "" ? titleCase(transaction.type) : transaction.description}</td>
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
    setTransaction: (account: Partial<WorkingTransaction>) => void,
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

export function Transactions() {
    const { accountId } = useParams();

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const [transactions, setTransactions] = useState<JTranscation[]>([]);

    const [showAdding, setShowAdding] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingTransaction, setAddingTransaction] = useState<Partial<WorkingTransaction>>({});

    const [showEditing, setShowEditing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<WorkingTransaction>>({});

    function refreshTransactions() {
        function sortTransactions(transactions: JTranscation[]) {
            return transactions.sort((left, right) => Date.parse(right.date) - Date.parse(left.date))
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

    useEffect(() => refreshTransactions(), []);

    return (
        <Container>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Value</th>
                        <th>Account</th>
                        <th>From</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => <Transaction key={transaction.id} transaction={transaction} accounts={accounts} edit={() => {
                        setEditingTransaction({...transaction, value: transaction.value.toString()});
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
        </Container>
    );
}
