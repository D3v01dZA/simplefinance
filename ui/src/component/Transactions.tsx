import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Col, Container, Form, Modal, OverlayTrigger, Popover, Row, Table } from "react-bootstrap";
import { useParams, useSearchParams } from "react-router-dom";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { constrainedPage, defaultAccountId, del, err, filterTransactions, formattedAmount, get, isValueValid, post, sortTransactions, titleCase, today } from "../util/util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faPlus, faCartPlus, faFilter, faBalanceScale } from '@fortawesome/free-solid-svg-icons';
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination";
import { AccountName, cellStyle } from "../util/common";
import { selectSettings } from "../app/settingSlice";
import { TransactionModal, WorkingTransaction } from "./sub-component/TransactionModal";
import { BalanceAddingTranscations, BalanceTransactionModal } from "./sub-component/BalanceTransactionModal";
import { BulkTransactionModal, BulkWorkingTransactions, BulkWorkingTransactionsTransaction } from "./sub-component/BulkTransactionModal";

export enum TransactionType {
    BALANCE = "BALANCE",
    TRANSFER = "TRANSFER",
}

export interface JTranscation {
    id: string,
    description: string,
    date: string,
    value: string,
    type: TransactionType,
    accountId: string,
    fromAccountId: string,
}

enum LastSType {
    DAYS = "DAYS",
    WEEKS = "WEEKS",
    MONTHS = "MONTHS"
}

function description(transaction: JTranscation) {
    return transaction.description === "" ? titleCase(transaction.type) : transaction.description;
}

function Transaction({ 
    transaction, 
    accounts, 
    edit, 
    del, 
    inlineTransaction, 
    setInlineTransaction, 
    saveInlineTransaction,
    savingInlineTransaction
}: { 
        transaction: JTranscation, 
        accounts: IndexedAccounts, 
        edit: () => void, 
        del: () => void, 
        inlineTransaction: Partial<JTranscation>, 
        setInlineTransaction: (transaction: Partial<JTranscation>) => void,
        saveInlineTransaction: (transaction: JTranscation) => void,
        savingInlineTransaction: boolean
}) {
    return (
        <tr>
            <td style={cellStyle("100px")}>{titleCase(transaction.type)}</td>
            <td style={cellStyle("100px")}>
                <Form.Control 
                    type="text" 
                    disabled={savingInlineTransaction}
                    value={inlineTransaction.id === transaction.id && inlineTransaction.description ? inlineTransaction.description : description(transaction)} 
                    onChange={e => setInlineTransaction({ id: transaction.id, description: e.target.value })} 
                    onBlur={e => saveInlineTransaction({ ...transaction, description: e.target.value })}
                />
            </td>
            <td style={cellStyle("100px")}>
                <Form.Control 
                    type="date" 
                    disabled={savingInlineTransaction}
                    value={inlineTransaction.id === transaction.id && inlineTransaction.date ? inlineTransaction.date : transaction?.date} 
                    onChange={e => setInlineTransaction({ id: transaction.id, date: e.target.value })} 
                    onBlur={e => saveInlineTransaction({ ...transaction, date: e.target.value })}
                />
            </td>
            <td style={cellStyle("100px")}>
                <Form.Control 
                    type="text" 
                    disabled={savingInlineTransaction}
                    style={{textAlign: "right"}}
                    isInvalid={inlineTransaction.id === transaction.id && inlineTransaction.value ? !isValueValid(inlineTransaction.value) : !isValueValid(transaction?.value)}
                    value={inlineTransaction.id === transaction.id && inlineTransaction.value ? inlineTransaction.value : transaction.value} 
                    onChange={e => setInlineTransaction({ id: transaction.id, value: e.target.value })} 
                    onBlur={e => saveInlineTransaction({ ...transaction, value: e.target.value })}
                />
            </td>
            <td style={cellStyle("200px")}><AccountName accountId={transaction.accountId} accounts={accounts} /></td>
            <td style={cellStyle("200px")}><AccountName accountId={transaction.fromAccountId} accounts={accounts} /></td>
            <td style={cellStyle("100px")}>
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
    
    const [inlineTransaction, setInlineTransaction] = useState<Partial<JTranscation>>({});
    const [savingInlineTransaction, setSavingInlineTransaction] = useState<boolean>(false);

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

    function saveInlineTranscation(transaction: JTranscation) {
        setSavingInlineTransaction(true);
        post(server, `/api/transaction/${transaction.id}/`, transaction)
            .then(() => refreshTransactions())
            .catch(error => err(error))
            .finally(() => {
                setSavingInlineTransaction(false);
            });
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
                            }} inlineTransaction={inlineTransaction} setInlineTransaction={setInlineTransaction} saveInlineTransaction={saveInlineTranscation} savingInlineTransaction={savingInlineTransaction} />)}
                            <tr>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>
                                    <ButtonGroup>
                                        {
                                            accountId !== undefined ? null : <>
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
                                            </>
                                        }
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
            <BulkTransactionModal accounts={accounts} settings={settings} specific={false} show={showBulkAdding} setShow={setShowBulkAdding} transactions={bulkAddingTransactions} setTransactions={setBulkAddingTransactions} saving={bulkAdding} save={() => {
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
            <BalanceTransactionModal accounts={accounts} settings={settings} specificAccounts={undefined} show={showBalanceAdding} setShow={setShowBalanceAdding} date={balanceAddingDate} setDate={setBalanceAddingDate} transactions={transactions} balanceAddingTransactions={balanceAddingTransactions} setBalanceAddingTransactions={setBalanceAddingTransactions} saving={balanceAdding} save={() => {
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
