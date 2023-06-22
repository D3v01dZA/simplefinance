import { useEffect, useState } from "react";
import { Button, Container, Modal, Row, Form, ButtonGroup, Table } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faTrash, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { get, err, titleCase, post, del, constrainedPage } from "../util/util";
import { AccountType, JAccount, selectAccounts, setAccounts } from "../app/accountSlice";
import { LinkContainer } from "react-router-bootstrap";
import { Pagination } from "./Pagination";

function Account({ account, edit, del }: { account: JAccount, edit: () => void, del: () => void }) {
    return (
        <tr>
            <td>{titleCase(account.type)}</td>
            <td>{account.name}</td>
            <td>
                <ButtonGroup>
                    <LinkContainer to={`/accounts/${account.id}/transactions`}>
                        <Button variant="warning">
                            <FontAwesomeIcon title="Transactions" icon={faMoneyBillTransfer} />
                        </Button>
                    </LinkContainer>
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

function AccountModal({
    show,
    setShow,
    account,
    setAccount,
    saving,
    save
}: {
    show: boolean,
    setShow: (value: boolean) => void,
    account: Partial<JAccount>,
    setAccount: (account: Partial<JAccount>) => void,
    saving: boolean,
    save: () => void
}) {
    const isAdd = account.id === undefined;

    return (
        <Modal show={show} onHide={() => setShow(false)} >
            <Modal.Header closeButton>
                <Modal.Title>{isAdd ? "Add" : "Edit"} Account</Modal.Title>
            </Modal.Header>
            <Form>
                <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" value={account?.name} onChange={e => setAccount({ ...account, name: e.target.value })}></Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select disabled={!isAdd} value={account?.type} onChange={e => setAccount({ ...account, type: e.target.value as AccountType })}>
                        {Object.keys(AccountType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
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

export function Accounts() {
    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const dispatch = useAppDispatch();

    const [accountTypeFilter, setAccountTypeFilter] = useState<"none" | AccountType>("none");
    const [filteredAccounts, setFilteredAccounts] = useState<JAccount[]>([]);

    const [pageSize, setPageSize] = useState(10);
    const [page, _setPage] = useState(0);

    const [showAdding, setShowAdding] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingAccount, setAddingAccount] = useState<Partial<JAccount>>({});

    const [showEditing, setShowEditing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Partial<JAccount>>({});

    function refreshAccounts() {
        function sortAccounts(accounts: JAccount[]) {
            return accounts.sort((left, right) => left.name.localeCompare(right.name));
        }

        get<JAccount[]>(server, "/api/account/")
            .then(accounts => dispatch(setAccounts(sortAccounts(accounts))))
            .catch(error => err(error));
    }

    function accountsToDisplay() {
        if (pageSize === 0) {
            return filteredAccounts;
        }
        return filteredAccounts.slice(pageSize * page, pageSize * page + pageSize);
    }

    function setPage(newPage: number) {
        const constrained = constrainedPage(filteredAccounts.length, pageSize, newPage);
        _setPage(constrained);
    }

    useEffect(() => {
        if (accountTypeFilter === "none") {
            setFilteredAccounts(Object.values(accounts));
        } else {
            const filtered = Object.values(accounts).filter(account => account.type === accountTypeFilter);
            setFilteredAccounts(filtered);
        }
    }, [accounts, accountTypeFilter]);

    return (
        <Container>
            <Row xl={3}>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select value={accountTypeFilter} onChange={e => setAccountTypeFilter(e.target.value as any)}>
                        <option value={"none"}></option>
                        {Object.keys(AccountType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
            </Row>
            <Row>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accountsToDisplay().map(account => <Account key={account.id} account={account} edit={() => {
                            setEditingAccount(account);
                            setShowEditing(true);
                        }} del={() => {
                            if (confirm(`Are you sure you want to delete ${account.name}?`)) {
                                del(server, `/api/account/${account.id}/`)
                                    .then(() => refreshAccounts())
                                    .catch(error => err(error));
                            }
                        }} />)}
                        <tr>
                            <td></td>
                            <td></td>
                            <td>
                                <ButtonGroup>
                                    <Button variant="success" onClick={() => {
                                        setAddingAccount({ type: AccountType.SAVINGS });
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
            <Pagination itemCount={Object.values(accounts).length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
            <AccountModal show={showAdding} setShow={setShowAdding} account={addingAccount} setAccount={setAddingAccount} saving={adding} save={() => {
                setAdding(true);
                post(server, "/api/account/", addingAccount)
                    .then(() => refreshAccounts())
                    .catch(error => err(error))
                    .finally(() => {
                        setAdding(false);
                        setShowAdding(false);
                    });
            }} />
            <AccountModal show={showEditing} setShow={setShowEditing} account={editingAccount} setAccount={setEditingAccount} saving={editing} save={() => {
                setEditing(true);
                post(server, `/api/account/${editingAccount.id}/`, editingAccount)
                    .then(() => refreshAccounts())
                    .catch(error => err(error))
                    .finally(() => {
                        setEditing(false);
                        setShowEditing(false);
                    });
            }} />
        </Container>
    )
}