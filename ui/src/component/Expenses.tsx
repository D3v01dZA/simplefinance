import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { useEffect, useState } from "react";
import { constrainedPage, err, formattedAmount, get, post, titleCase, today, isValueValid, del, formattedUnknownAmount } from "../util/util";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faTrash, faMoneyBillTransfer, faFilter } from '@fortawesome/free-solid-svg-icons';
import { Button, Container, Modal, Row, Form, ButtonGroup, Table, OverlayTrigger, Popover, Col } from "react-bootstrap";
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination";
import { useSearchParams } from "react-router-dom";

enum ExpenseCategory {
    UNKNOWN = "UNKNOWN",
    OTHER = "OTHER",

    BILLS = "BILLS",
    ENTERTAINMENT = "ENTERTAINMENT",
    FITNESS = "FITNESS",
    GROCERIES = "GROCERIES",
    MAINTENANCE = "MAINTENANCE",
    MEDICAL = "MEDICAL",
    PETS = "PETS",
    RESTAURANTS = "RESTAURANTS",
    SUBSCRIPTIONS = "SUBSCRIPTIONS",
    VACATIONS = "VACATIONS",
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

    const [showAdding, setShowAdding] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingExpense, setAddingExpense] = useState<Partial<JExpense>>({});

    const [showEditing, setShowEditing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Partial<JExpense>>({});

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
            return expenses;
        }
        return expenses.slice(pageSize * page, pageSize * page + pageSize);
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

    useEffect(() => refresh(), []);

    useEffect(() => {
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

    return (
        <Container>
            <Row>
                <Col>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>External ID</th>
                                <th>Description</th>
                                <th>Date</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expensesToDisplay().map((expense, index) => (
                                <tr key={index}>
                                    <td>{titleCase(expense.category)}</td>
                                    <td>{expense.external}</td>
                                    <td>{expense.description}</td>
                                    <td>{expense.date}</td>
                                    <td className="text-end">{formattedUnknownAmount(expense.value)}</td>
                                    <td>
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
                                <td>
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
                    <Pagination itemCount={expenses.length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
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
