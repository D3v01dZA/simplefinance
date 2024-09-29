import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import React, { useEffect, useState } from "react";
import { constrainedPage, err, get, post, titleCase, today, isValueValid, del, formattedUnknownAmount } from "../util/util";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faTrash, faFilter } from '@fortawesome/free-solid-svg-icons';
import { Button, Container, Modal, Row, Form, ButtonGroup, Table, OverlayTrigger, Popover, Col } from "react-bootstrap";
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination";
import { useSearchParams } from "react-router-dom";

export enum ExpenseCategory {
    UNKNOWN = "UNKNOWN",
    OTHER = "OTHER",

    BILLS = "BILLS",
    ELECTRONICS = "ELECTRONICS",
    ENTERTAINMENT = "ENTERTAINMENT",
    FITNESS = "FITNESS",
    GROCERIES = "GROCERIES",
    HOUSE = "HOUSE",
    MAINTENANCE = "MAINTENANCE",
    MEDICAL = "MEDICAL",
    PETS = "PETS",
    RESTAURANTS = "RESTAURANTS",
    SUBSCRIPTIONS = "SUBSCRIPTIONS",
    VACATIONS = "VACATIONS",
}

enum LastSType {
    DAYS = "DAYS",
    WEEKS = "WEEKS",
    MONTHS = "MONTHS"
}

interface JExpense {
    id: string,
    description: string,
    external: string,
    category: ExpenseCategory,
    date: string,
    value: string,
}

function ExpenseModal({
    show,
    setShow,
    expense,
    setExpense,
    saving,
    save
}: {
    show: boolean,
    setShow: (value: boolean) => void,
    expense: Partial<JExpense>,
    setExpense: (expense: Partial<JExpense>) => void,
    saving: boolean,
    save: () => void
}) {
    const isAdd = expense.id === undefined;

    return (
        <Modal show={show} onHide={() => setShow(false)} >
            <Modal.Header closeButton>
                <Modal.Title>{isAdd ? "Add" : "Edit"} Expense</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>External Id</Form.Label>
                        <Form.Control type="text" value={expense?.external} onChange={e => setExpense({ ...expense, external: e.target.value })}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control type="text" value={expense?.description} onChange={e => setExpense({ ...expense, description: e.target.value })}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Category</Form.Label>
                        <Form.Select value={expense?.category} onChange={e => setExpense({ ...expense, category: e.target.value as ExpenseCategory })}>
                            {Object.keys(ExpenseCategory).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Date</Form.Label>
                        <Form.Control type="date" value={expense?.date} onChange={e => setExpense({ ...expense, date: e.target.value })}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Value</Form.Label>
                        <Form.Control type="text" isInvalid={!isValueValid(expense?.value)} value={expense?.value} onChange={e => setExpense({ ...expense, value: e.target.value })}></Form.Control>
                    </Form.Group>
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


export function Expenses() {
    const [searchParams, _setSearchParams] = useSearchParams();

    const server = useAppSelector(selectServer);

    const [expenses, setExpenses] = useState<JExpense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<JExpense[]>([]);

    const [showAdding, setShowAdding] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingExpense, setAddingExpense] = useState<Partial<JExpense>>({});

    const [showEditing, setShowEditing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Partial<JExpense>>({});

    const [categoryFilter, setCategoryFilter] = useState<"none" | ExpenseCategory>("none");
    const [descriptionFilter, setDescriptionFilter] = useState("");
    const [externalFilter, setExternalFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [lastNFilter, setLastNFilter] = useState("");
    const [lastSFilter, setLastSFilter] = useState<LastSType>(LastSType.DAYS);

    const [pageSize, _setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [page, _setPage] = useState(0);

    function refresh() {
        function sortExpenses(expenses: JExpense[]) {
            return expenses.sort((left, right) => {
                let date = Date.parse(right.date) - Date.parse(left.date);
                if (date != 0) {
                    return date;
                }
                let issueType = right.category.localeCompare(left.category);
                if (issueType != 0) {
                    return issueType;
                }
                return right.description.localeCompare(left.description);
            });
        }

        get<JExpense[]>(server, `/api/expense/`)
            .then(expenses => setExpenses(sortExpenses(expenses)))
            .catch(error => err(error));
    }

    function expensesToDisplay() {
        if (pageSize === 0) {
            return filteredExpenses;
        }
        return filteredExpenses.slice(pageSize * page, pageSize * page + pageSize);
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

    function setPage(newPage: number) {
        const constrained = constrainedPage(expenses.length, pageSize, newPage);
        setSearchParams("page", constrained + 1);
    }

    function setPageSize(pageSize: number) {
        if (pageSize === DEFAULT_PAGE_SIZE) {
            setSearchParams("pageSize", undefined);
        } else {
            setSearchParams("pageSize", pageSize);
        }
    }

    function clearSearchParams() {
        [...searchParams.keys()].forEach(key => searchParams.delete(key));
        _setSearchParams(searchParams);
    }

    useEffect(() => refresh(), []);

    useEffect(() => {
        let filtered = expenses;
        if (categoryFilter !== "none") {
            filtered = filtered.filter(expense => expense.category === categoryFilter);
        }
        if (descriptionFilter !== "") {
            let use = descriptionFilter.toLowerCase();
            filtered = filtered.filter(expense => expense.description.toLowerCase().includes(use));
        }
        if (externalFilter !== "") {
            let use = externalFilter.toLowerCase();
            filtered = filtered.filter(expense => expense.external.toLowerCase().includes(use));
        } 
        if (dateFilter !== "") {
            const filter = new Date(dateFilter + "T00:00:00").getTime();
            filtered = filtered.filter(expense => new Date(expense.date + "T00:00:00").getTime() === filter);
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
        setFilteredExpenses(filtered);
    }, [expenses, categoryFilter, descriptionFilter, externalFilter, dateFilter, lastNFilter, lastSFilter])

    useEffect(() => {
        const category = searchParams.get("category");
        if (category !== null) {
            setCategoryFilter(category as ExpenseCategory);
        } else {
            setCategoryFilter("none");
        }
        const description = searchParams.get("description");
        if (description !== null) {
            setDescriptionFilter(description);
        } else {
            setDescriptionFilter("");
        }
        const external = searchParams.get("external");
        if (external !== null) {
            setExternalFilter(external);
        } else {
            setExternalFilter("");
        }
        const date = searchParams.get("date");
        if (date !== null) {
            setDateFilter(date);
        } else {
            setDateFilter("");
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
        const page = searchParams.get("page");
        if (page != null) {
            _setPage(parseInt(page) - 1);
        } else {
            _setPage(0)
        }
        const pageSize = searchParams.get("pageSize");
        if (pageSize != null) {
            _setPageSize(parseInt(pageSize));
        } else {
            _setPageSize(DEFAULT_PAGE_SIZE);
        }
    }, [searchParams])

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

    const categoryFilterPopover = (
        <Popover>
            <Popover.Body>
                <h6>Local Filters</h6>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select value={categoryFilter} onChange={e => setSearchParams("category", e.target.value)}>
                        <option value={"none"}></option>
                        {Object.keys(ExpenseCategory).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
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
                    <Form.Control value={descriptionFilter} onChange={e => setSearchParams("description", e.target.value)} />
                </Form.Group>
                {clearFilters}
            </Popover.Body>
        </Popover>
    );

    const externalFilterPopover = (
        <Popover>
            <Popover.Body>
                <h6>Local Filters</h6>
                <Form.Group>
                    <Form.Label>External</Form.Label>
                    <Form.Control value={externalFilter} onChange={e => setSearchParams("external", e.target.value)} />
                </Form.Group>
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
                    <Form.Control type="date" value={dateFilter} onChange={e => setSearchParams("date", e.target.value)} />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Last</Form.Label>
                    <Form.Control isInvalid={lastNFilter !== "" && !isValueValid(lastNFilter)} type="text" value={lastNFilter} onChange={e => setSearchParams("lastN", e.target.value)} />
                    <Form.Select value={lastSFilter} onChange={e => setSearchParams("lastS", e.target.value)}>
                        <option value={"none"}></option>
                        {Object.keys(LastSType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                {clearFilters}
            </Popover.Body>
        </Popover>
    );


    return (
        <Container>
            <Row>
                <Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th style={{whiteSpace: "nowrap"}}>Category <OverlayTrigger trigger="click" placement="bottom" overlay={categoryFilterPopover}><FontAwesomeIcon color={categoryFilter === "none" ? undefined : "blue"} icon={faFilter} /></OverlayTrigger></th>
                                <th style={{whiteSpace: "nowrap"}}>External ID <OverlayTrigger trigger="click" placement="bottom" overlay={externalFilterPopover}><FontAwesomeIcon color={externalFilter === "" ? undefined : "blue"} icon={faFilter} /></OverlayTrigger></th>
                                <th style={{whiteSpace: "nowrap"}}>Description <OverlayTrigger trigger="click" placement="bottom" overlay={descriptionFilterPopover}><FontAwesomeIcon color={descriptionFilter === "" ? undefined : "blue"} icon={faFilter} /></OverlayTrigger></th>
                                <th style={{whiteSpace: "nowrap"}}>Date <OverlayTrigger trigger="click" placement="bottom" overlay={dateFilterPopover}><FontAwesomeIcon color={dateFilter === "" ? undefined : "blue"} icon={faFilter} /></OverlayTrigger></th>
                                <th style={{whiteSpace: "nowrap"}}>Value</th>
                                <th style={{whiteSpace: "nowrap"}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expensesToDisplay().map((expense, index) => (
                                <tr key={index}>
                                    <td style={{whiteSpace: "nowrap"}}>{titleCase(expense.category)}</td>
                                    <td style={{whiteSpace: "nowrap"}}>{expense.external}</td>
                                    <td style={{whiteSpace: "nowrap"}}>{expense.description}</td>
                                    <td style={{whiteSpace: "nowrap"}}>{expense.date}</td>
                                    <td className="text-end">{formattedUnknownAmount(expense.value)}</td>
                                    <td style={{whiteSpace: "nowrap"}}>
                                        <ButtonGroup>
                                            <Button onClick={() => {
                                              setEditingExpense(expense);
                                              setShowEditing(true);
                                            }}>
                                              <FontAwesomeIcon title="Edit" icon={faPenToSquare} />
                                            </Button>
                                            <Button variant="danger" onClick={() => {
                                                if (confirm(`Are you sure you want to delete ${expense.id}?`)) {
                                                    del(server, `/api/expense/${expense.id}/`)
                                                        .then(() => refresh())
                                                        .catch(error => err(error));
                                                }
                                            }}>
                                              <FontAwesomeIcon title="Delete" icon={faTrash} />
                                            </Button>
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td style={{whiteSpace: "nowrap"}}>
                                    <ButtonGroup>
                                        <Button variant="success" onClick={() => {
                                            setAddingExpense({ description: "", category: ExpenseCategory.UNKNOWN, date: today(), value: "0" });
                                            setShowAdding(true);
                                        }}>
                                            <FontAwesomeIcon icon={faPlus} />
                                        </Button>
                                    </ButtonGroup>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                    <Pagination itemCount={filteredExpenses.length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
                </Col>
            </Row>
            <ExpenseModal show={showAdding} setShow={setShowAdding} expense={addingExpense} setExpense={setAddingExpense} saving={adding} save={() => {
                setAdding(true);
                post(server, "/api/expense/", addingExpense)
                    .then(() => refresh())
                    .catch(error => err(error))
                    .finally(() => {
                        setAdding(false);
                        setShowAdding(false);
                    });
            }} />
            <ExpenseModal show={showEditing} setShow={setShowEditing} expense={editingExpense} setExpense={setEditingExpense} saving={editing} save={() => {
                setEditing(true);
                post(server, `/api/expense/${editingExpense.id}/`, editingExpense)
                    .then(() => refresh())
                    .catch(error => err(error))
                    .finally(() => {
                        setEditing(false);
                        setShowEditing(false);
                    });
            }} />
        </Container>
    );
}
