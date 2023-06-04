import { useEffect, useState } from "react";
import { Button, Card, Container, Modal, Row, Form } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { get, err, titleCase, post, del } from "../util/util";

interface JAccount {
    id: string,
    name: string,
    type: AccountType,
}

enum AccountType {
    SAVINGS = "SAVINGS",
    CHECKING = "CHECKING",
    LOAN = "LOAN",
    INVESTMENT = "INVESTMENT",
    RETIREMENT = "RETIREMENT",
    ASSET = "ASSET",
    EXTERNAL = "EXTERNAL"
}

function Account({ account, edit, del }: { account: JAccount, edit: () => void, del: () => void }) {
    return (
        <Card>
            <Card.Body>
                <Card.Title>
                    {account.name}
                </Card.Title>
                <Card.Text>
                    {titleCase(account.type)}
                    <Row xl={2}>
                        <Button onClick={() => edit()}>
                            <FontAwesomeIcon title="Edit" icon={faPenToSquare} />
                        </Button>
                        <Button variant="danger" onClick={() => del()}>
                            <FontAwesomeIcon title="Delete" icon={faTrash} />
                        </Button>
                    </Row>
                </Card.Text>
            </Card.Body>
        </Card>
    );
}

function AccountModal({ show, setShow, account, setAccount, saving, save }: { show: boolean, setShow: (value: boolean) => void, account: Partial<JAccount>, setAccount: (account: Partial<JAccount>) => void, saving: boolean, save: () => void }) {
    return (
        <Modal show={show} onHide={() => setShow(false)} >
            <Modal.Header closeButton>
                <Modal.Title>{account != undefined ? "Add" : "ERROR"} Account</Modal.Title>
            </Modal.Header>
            <Form>
                <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" value={account?.name} onChange={e => setAccount({ ...account, name: e.target.value })}></Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select value={account?.type} onChange={e => setAccount({ ...account, type: e.target.value as AccountType })}>
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

    const [accounts, setAccounts] = useState<JAccount[]>([]);

    const [showAdding, setShowAdding] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addingAccount, setAddingAccount] = useState<Partial<JAccount>>({ type: AccountType.SAVINGS });

    const [showEditing, setShowEditing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Partial<JAccount>>({});

    function refreshAccounts() {
        get<JAccount[]>(server, "/api/account/")
            .then(accounts => setAccounts(accounts))
            .catch(error => err(error));
    }

    useEffect(() => refreshAccounts(), []);

    return (
        <Container>
            <Row xs={1} md={2} xl={3}>
                {accounts.map(account => <Account key={account.id} account={account} edit={() => {
                    setEditingAccount(account);
                    setShowEditing(true);
                }} del={() => {
                    if (confirm(`Are you sure you want to delete ${account.name}?`)) {
                        del(server, `/api/account/${account.id}/`)
                            .then(() => refreshAccounts())
                            .catch(error => err(error));
                    }
                }} />)}
                <Card>
                    <Card.Body>
                        <Card.Title>
                            New Account
                        </Card.Title>
                        <Card.Text title="Add">
                            <Row xs={1} md={1} xl={1}>
                                <Button variant="success" onClick={() => {
                                    setAddingAccount({ type: AccountType.SAVINGS });
                                    setShowAdding(true);
                                }}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </Button>
                            </Row>
                        </Card.Text>
                    </Card.Body>
                </Card>
            </Row>
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