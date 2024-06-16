import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Col, Container, Form, Modal, OverlayTrigger, Popover, Row, Table } from "react-bootstrap";
import { useParams, useSearchParams } from "react-router-dom";
import { AccountType, IndexedAccounts, selectAccounts } from "../app/accountSlice";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { constrainedPage, defaultAccountId, del, err, formattedAmount, get, isValueValid, post, titleCase, today } from "../util/util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faPlus, faCartPlus, faFilter, faBalanceScale } from '@fortawesome/free-solid-svg-icons';
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination";
import { AccountName } from "../util/common";
import { IndexedSettings, selectSettings } from "../app/settingSlice";
import { TransactionModal, WorkingTransaction } from "./sub-component/TransactionModal";

export enum TransactionType {
    BALANCE = "BALANCE",
    TRANSFER = "TRANSFER",
}

enum LastSType {
    DAYS = "DAYS",
    WEEKS = "WEEKS",
    MONTHS = "MONTHS"
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

interface BalanceAddingTranscations {
    [accountId: string]: string
}

interface BulkWorkingTransactionsTransaction {
    accountId: string,
    value?: string,
}

interface BulkWorkingTransactions {
    description: string,
    date: string,
    type: TransactionType,
    fromAccountId?: string,
    transactions: BulkWorkingTransactionsTransaction[]
}

function description(transaction: JTranscation) {
    return transaction.description === "" ? titleCase(transaction.type) : transaction.description;
}

function filterTransactions(transactions: JTranscation[], transactionType: TransactionType, predicate?: (transaction: JTranscation) => boolean) {
    const encounteredAccountIds = new Set();
    return transactions.filter(transaction => {
        if (transaction.type !== transactionType) {
            return false;
        }
        if (predicate && !predicate(transaction)) {
            return false;
        }
        if (encounteredAccountIds.has(transaction.accountId)) {
            return false;
        }
        encounteredAccountIds.add(transaction.accountId);
        return true;
    });
}

function Transaction({ transaction, accounts, edit, del }: { transaction: JTranscation, accounts: IndexedAccounts, edit: () => void, del: () => void }) {
    return (
        <tr>
            <td>{titleCase(transaction.type)}</td>
            <td>{description(transaction)}</td>
            <td>{transaction.date}</td>
            <td className="text-end">{formattedAmount(transaction.value)}</td>
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

function BulkTransactionModal({
    accounts,
    settings,
    show,
    setShow,
    transactions,
    setTransactions,
    saving,
    save
}: {
    accounts: IndexedAccounts,
    settings: IndexedSettings,
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
            <Modal.Body>
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
                            const fromAccountId = type === TransactionType.TRANSFER ? defaultAccountId(settings, accounts) : undefined;
                            setTransactions({ ...transactions, fromAccountId, type });
                        }}>
                            {Object.keys(TransactionType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group hidden={transactions.type !== TransactionType.TRANSFER}>
                        <Form.Label>From Account</Form.Label>
                        <Form.Select disabled={transactions.type !== TransactionType.TRANSFER} value={transactions.fromAccountId} onChange={e => setTransactions({ ...transactions, fromAccountId: e.target.value })}>
                            {
                                Object.values(accounts)
                                    .filter(account => !(settings.NO_REGULAR_BALANCE_ACCOUNTS?.value ?? "").includes(account.id))
                                    .map(account => <option key={account.id} value={account.id}>{account.name} ({titleCase(account.type)})</option>)
                            }
                        </Form.Select>
                    </Form.Group>
                    {(transactions.transactions).map((transaction, index) => {
                        return (
                            <React.Fragment key={index}>
                                <Form.Group>
                                    <Form.Label>Value</Form.Label>
                                    <Form.Control type="text" isInvalid={!isValueValid(transaction.value)} value={transaction.value} onChange={e => editTransaction(index, { value: e.target.value })}></Form.Control>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Account</Form.Label>
                                    <Form.Select value={transaction?.accountId} onChange={e => editTransaction(index, { accountId: e.target.value })}>
                                        {
                                            Object.values(accounts)
                                                .filter(account => !(settings.NO_REGULAR_BALANCE_ACCOUNTS?.value ?? "").includes(account.id))
                                                .map(account => <option key={account.id} value={account.id}>{account.name} ({titleCase(account.type)})</option>)
                                        }
                                    </Form.Select>
                                </Form.Group>
                                <br />
                                <Row>
                                    <Col>
                                        {index !== transactions.transactions.length - 1 ? (
                                            <ButtonGroup className="float-end">
                                                <Button variant="danger" onClick={() => deleteTransaction(index)}>
                                                    Delete Transaction
                                                </Button>
                                            </ButtonGroup>
                                        ) : (
                                            <ButtonGroup className="float-end">
                                                <Button onClick={() => setTransactions({ ...transactions, transactions: transactions.transactions.concat({ accountId: defaultAccountId(settings, accounts) }) })}>
                                                    Add Transaction
                                                </Button>
                                                <Button variant="danger" onClick={() => deleteTransaction(index)}>
                                                    Delete Transaction
                                                </Button>
                                            </ButtonGroup>
                                        )}
                                    </Col>
                                </Row>
                            </React.Fragment>
                        );
                    })}
                    <br />
                    <Row>
                        <Col>

                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
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

function BalanceTransactionModal({
    accounts,
    settings,
    show,
    setShow,
    date,
    setDate,
    transactions,
    balanceAddingTransactions,
    setBalanceAddingTransactions,
    saving,
    save
}: {
    accounts: IndexedAccounts,
    settings: IndexedSettings,
    show: boolean,
    setShow: (value: boolean) => void,
    date: string,
    setDate: (value: string) => void,
    transactions: JTranscation[],
    balanceAddingTransactions: BalanceAddingTranscations,
    setBalanceAddingTransactions: (value: BalanceAddingTranscations) => void,
    saving: boolean,
    save: () => void
}) {
    let actualDate = new Date(date);
    const mappedTransactions = filterTransactions(transactions, TransactionType.BALANCE, transaction => new Date(transaction.date) <= actualDate).reduce<{ [accountId: string]: JTranscation }>((acc, current) => {
        acc[current.accountId] = current;
        return acc;
    }, {});

    function editTransaction(accountId: string, value: string) {
        if (value === undefined || value === "") {
            const copy = { ...balanceAddingTransactions }
            delete copy[accountId];
            setBalanceAddingTransactions(copy);
        } else {
            setBalanceAddingTransactions({
                ...balanceAddingTransactions,
                [accountId]: value
            });
        }
    }

    function placeholder(accountId: string) {
        let transaction = mappedTransactions[accountId];
        if (!transaction || transaction.date === date) {
            return undefined;
        }
        return formattedAmount(transaction.value) + "";
    }

    function value(accountId: string): string {
        let transaction = mappedTransactions[accountId];
        if (!transaction || transaction.date !== date) {
            return balanceAddingTransactions[accountId] ?? "";
        }
        return transaction.value + "";
    }

    function disabled(accountId: string) {
        let transaction = mappedTransactions[accountId];
        if (!transaction || transaction.date !== date) {
            return false;
        }
        return true;
    }

    return (
        <Modal show={show} onHide={() => setShow(false)} >
            <Modal.Header closeButton>
                <Modal.Title>Add Multiple Balance Transactions</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" value={date} onChange={e => setDate(e.target.value)}></Form.Control>
                </Form.Group>
                {
                    Object.values(accounts)
                        .filter(account => account.type !== AccountType.EXTERNAL)
                        .filter(account => !(settings.NO_REGULAR_BALANCE_ACCOUNTS?.value ?? "").includes(account.id))
                        .map(account => account.id)
                        .map(id => {
                            return (
                                <Form.Group key={id}>
                                    <Form.Label><AccountName accountId={id} accounts={accounts} /></Form.Label>
                                    <Form.Control type="text" className="colored-placeholder" value={value(id)} placeholder={placeholder(id)} disabled={disabled(id)} isInvalid={value(id) !== "" && !isValueValid(value(id))} onChange={e => editTransaction(id, e.target.value)}></Form.Control>
                                </Form.Group>
                            )
                        })
                }
            </Modal.Body>
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
    const [searchParams, _setSearchParams] = useSearchParams();

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);
    const settings = useAppSelector(selectSettings);

    const [pageSize, _setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [page, _setPage] = useState(0);

    const [transactionTypeFilter, setTransactionTypeFilter] = useState<"none" | TransactionType>("none");
    const [descriptionFilter, setDescriptionFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [lastNFilter, setLastNFilter] = useState("");
    const [lastSFilter, setLastSFilter] = useState<LastSType>(LastSType.DAYS);
    const [lastTransactionByTypeFilter, setLastTransactionByTypeFilter] = useState<"none" | TransactionType>("none");

    const [transactions, setTransactions] = useState<JTranscation[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<JTranscation[]>([]);

    const [showAdding, setShowAdding] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingTransaction, setAddingTransaction] = useState<Partial<WorkingTransaction>>({});

    const [showBalanceAdding, setShowBalanceAdding] = useState(false);
    const [balanceAdding, setBalanceAdding] = useState(false);
    const [balanceAddingDate, setBalanceAddingDate] = useState(today());
    const [balanceAddingTransactions, setBalanceAddingTransactions] = useState<BalanceAddingTranscations>({});

    const [showBulkAdding, setShowBulkAdding] = useState(false);
    const [bulkAdding, setBulkAdding] = useState(false);
    const [bulkAddingTransactions, setBulkAddingTransactions] = useState<BulkWorkingTransactions>(bulkTranscationsDefault());

    const [showEditing, setShowEditing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<WorkingTransaction>>({});

    function bulkTranscationsDefault(transaction?: BulkWorkingTransactionsTransaction) {
        let bulk: BulkWorkingTransactions = {
            description: "",
            date: today(),
            type: TransactionType.TRANSFER,
            fromAccountId: defaultAccountId(settings, accounts),
            transactions: []
        }
        if (transaction !== undefined) {
            bulk.transactions.push(transaction);
        }
        return bulk;
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
        setSearchParams("page", constrained + 1);
    }

    function setPageSize(pageSize: number) {
        if (pageSize === DEFAULT_PAGE_SIZE) {
            setSearchParams("pageSize", undefined);
        } else {
            setSearchParams("pageSize", pageSize);
        }
    }

    function setSearchParams(key: string, value: string | number | undefined) {
        if (value === undefined || value === "" || value === "none" || value === 1) {
            searchParams.delete(key);
            _setSearchParams(searchParams);
        } else {
            searchParams.set(key, value + "");
            _setSearchParams(searchParams);
        }
    }

    function clearSearchParams() {
        [...searchParams.keys()].forEach(key => searchParams.delete(key));
        _setSearchParams(searchParams);
    }

    function globalFilterActive() {
        return lastTransactionByTypeFilter !== "none";
    }

    useEffect(() => refreshTransactions(), []);

    useEffect(() => {
        if (lastTransactionByTypeFilter !== "none") {
            setFilteredTransactions(filterTransactions(transactions, lastTransactionByTypeFilter));
        } else {
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
            if (lastNFilter !== "") {
                const lastNFilterCount = parseInt(lastNFilter);
                let date = new Date();
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
                switch (lastSFilter) {
                    case LastSType.DAYS:
                        date.setDate(date.getDate() - lastNFilterCount);
                        break;
                    case LastSType.WEEKS:
                        date.setDate(date.getDate() - (lastNFilterCount * 7));
                        break;
                    case LastSType.MONTHS:
                        date.setDate(date.getDate() - (lastNFilterCount * 31));
                        break;
                }
                filtered = filtered.filter(transaction => new Date(transaction.date + "T00:00:00").getTime() >= date.getTime());
            }
            setFilteredTransactions(filtered);
        }
    }, [transactions, transactionTypeFilter, descriptionFilter, dateFilter, lastTransactionByTypeFilter, lastSFilter, lastNFilter]);

    useEffect(() => {
        const transactionType = searchParams.get("type");
        if (transactionType !== null) {
            setTransactionTypeFilter(transactionType as TransactionType);
        } else {
            setTransactionTypeFilter("none");
        }
        const description = searchParams.get("description");
        if (description !== null) {
            setDescriptionFilter(description);
        } else {
            setDescriptionFilter("");
        }
        const date = searchParams.get("date");
        if (date !== null) {
            setDateFilter(date);
        } else {
            setDateFilter("");
        }
        const lastTransactionByType = searchParams.get("lastTransactionByType");
        if (lastTransactionByType !== null) {
            setLastTransactionByTypeFilter(lastTransactionByType as TransactionType);
        } else {
            setLastTransactionByTypeFilter("none");
        }
        const page = searchParams.get("page");
        if (page != null) {
            _setPage(parseInt(page) - 1);
        } else {
            _setPage(0);
        }
        const pageSize = searchParams.get("pageSize");
        if (pageSize != null) {
            _setPageSize(parseInt(pageSize));
        } else {
            _setPageSize(DEFAULT_PAGE_SIZE);
        }
        const lastN = searchParams.get("lastN");
        if (lastN != null) {
            setLastNFilter(lastN);
        } else {
            setLastNFilter("");
        }
        const lastS = searchParams.get("lastS");
        if (lastS != null) {
            setLastSFilter(lastS as LastSType);
        } else {
            setLastSFilter(LastSType.DAYS);
        }
    }, [searchParams])

    const globalFilters = (
        <React.Fragment>
            <br />
            <h6>Global Filters</h6>
            <Form.Group>
                <Form.Label>Last Transaction By Type</Form.Label>
                <Form.Select value={lastTransactionByTypeFilter} onChange={e => setSearchParams("lastTransactionByType", e.target.value)}>
                    <option value={"none"}></option>
                    {Object.keys(TransactionType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                </Form.Select>
            </Form.Group>
        </React.Fragment>
    )

    const clearFilters = (
        <React.Fragment>
            <br />
            <Row>
                <Col>
                    <Button variant="danger" style={{ width: "100%" }} onClick={_ => clearSearchParams()}>
                        Clear Filters
                    </Button>
                </Col>
            </Row>
        </React.Fragment>
    );

    const transactionTypeFilterPopover = (
        <Popover>
            <Popover.Body>
                <h6>Local Filters</h6>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select disabled={globalFilterActive()} value={transactionTypeFilter} onChange={e => setSearchParams("type", e.target.value)}>
                        <option value={"none"}></option>
                        {Object.keys(TransactionType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                {globalFilters}
                {clearFilters}
            </Popover.Body>
        </Popover>
    );

    const descriptionFilterPopover = (
        <Popover>
            <Popover.Body>
                <h6>Local Filters</h6>
                <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control disabled={globalFilterActive()} value={descriptionFilter} onChange={e => setSearchParams("description", e.target.value)} />
                </Form.Group>
                {globalFilters}
                {clearFilters}
            </Popover.Body>
        </Popover>
    );

    const dateFilterPopover = (
        <Popover>
            <Popover.Body>
                <h6>Local Filters</h6>
                <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control disabled={globalFilterActive()} type="date" value={dateFilter} onChange={e => setSearchParams("date", e.target.value)} />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Last</Form.Label>
                    <Form.Control disabled={globalFilterActive()} isInvalid={lastNFilter !== "" && !isValueValid(lastNFilter)} type="text" value={lastNFilter} onChange={e => setSearchParams("lastN", e.target.value)} />
                    <Form.Select disabled={globalFilterActive()} value={lastSFilter} onChange={e => setSearchParams("lastS", e.target.value)}>
                        <option value={"none"}></option>
                        {Object.keys(LastSType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                {globalFilters}
                {clearFilters}
            </Popover.Body>
        </Popover>
    );

    return (
        <Container>
            <Row xl={1}>
                <Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Type  <OverlayTrigger trigger="click" placement="bottom" overlay={transactionTypeFilterPopover}><FontAwesomeIcon color={globalFilterActive() ? "red" : transactionTypeFilter === "none" ? undefined : "blue"} icon={faFilter} /></OverlayTrigger></th>
                                <th>Description <OverlayTrigger trigger="click" placement="bottom" overlay={descriptionFilterPopover}><FontAwesomeIcon color={globalFilterActive() ? "red" : descriptionFilter === "" ? undefined : "blue"} icon={faFilter} /></OverlayTrigger></th>
                                <th>Date <OverlayTrigger trigger="click" placement="bottom" overlay={dateFilterPopover}><FontAwesomeIcon color={globalFilterActive() ? "red" : dateFilter === "" ? undefined : "blue"} icon={faFilter} /></OverlayTrigger></th>
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
                                    del(server, `/api/transaction/${transaction.id}/`)
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
                                            setBulkAddingTransactions(bulkTranscationsDefault({ accountId: Object.keys(accounts)[0] }));
                                            setShowBulkAdding(true);
                                        }}>
                                            <FontAwesomeIcon icon={faCartPlus} />
                                        </Button>
                                        <Button variant="warning" onClick={() => {
                                            setBalanceAddingTransactions({});
                                            setBalanceAddingDate(today());
                                            setShowBalanceAdding(true);
                                        }}>
                                            <FontAwesomeIcon icon={faBalanceScale} />
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
                </Col>
            </Row>
            <Pagination itemCount={filteredTransactions.length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
            <TransactionModal accounts={accounts} settings={settings} singleAccount={accountId !== undefined} singleType={false} singleDate={false} show={showAdding} setShow={setShowAdding} transaction={addingTransaction} setTransaction={setAddingTransaction} saving={adding} save={() => {
                setAdding(true);
                post(server, `/api/transaction/`, addingTransaction)
                    .then(() => refreshTransactions())
                    .catch(error => err(error))
                    .finally(() => {
                        setAdding(false);
                        setShowAdding(false);
                    });
            }} />
            <TransactionModal accounts={accounts} settings={settings} singleAccount={accountId !== undefined} singleType={false} singleDate={false} show={showEditing} setShow={setShowEditing} transaction={editingTransaction} setTransaction={setEditingTransaction} saving={editing} save={() => {
                setEditing(true);
                post(server, `/api/transaction/${editingTransaction.id}/`, editingTransaction)
                    .then(() => refreshTransactions())
                    .catch(error => err(error))
                    .finally(() => {
                        setEditing(false);
                        setShowEditing(false);
                    });
            }} />
            <BulkTransactionModal accounts={accounts} settings={settings} show={showBulkAdding} setShow={setShowBulkAdding} transactions={bulkAddingTransactions} setTransactions={setBulkAddingTransactions} saving={bulkAdding} save={() => {
                setBulkAdding(true);
                Promise.all(bulkAddingTransactions.transactions.map(transaction => post(server, `/api/transaction/`, {
                    ...bulkAddingTransactions,
                    ...transaction
                }))).then(() => refreshTransactions())
                    .catch(error => err(error))
                    .finally(() => {
                        setBulkAdding(false);
                        setShowBulkAdding(false);
                    });
            }} />
            <BalanceTransactionModal accounts={accounts} settings={settings} show={showBalanceAdding} setShow={setShowBalanceAdding} date={balanceAddingDate} setDate={setBalanceAddingDate} transactions={transactions} balanceAddingTransactions={balanceAddingTransactions} setBalanceAddingTransactions={setBalanceAddingTransactions} saving={balanceAdding} save={() => {
                setBalanceAdding(true);
                Promise.all(Object.entries(balanceAddingTransactions).map(([id, value]) => {
                    let transaction = {
                        description: "",
                        accountId: id,
                        date: balanceAddingDate,
                        value: value,
                        type: TransactionType.BALANCE,
                    }
                    return post(server, `/api/transaction/`, transaction);
                })).then(() => refreshTransactions())
                    .catch(error => err(error))
                    .finally(() => {
                        setBalanceAdding(false);
                        setShowBalanceAdding(false);
                    });
            }} />
        </Container >
    );
}
