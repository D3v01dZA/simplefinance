import { useEffect, useState } from "react";
import { Card, Container, Row } from "react-bootstrap";
import { Variant } from "react-bootstrap/esm/types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { get, err } from "../util/util";

interface JAccount {
    id: string,
    name: string,
    type: AccountType
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

function decideBorder(account: JAccount): Variant {
    switch (account.type) {
        case AccountType.SAVINGS:
            return "primary";
        case AccountType.CHECKING:
            return "primary";
        case AccountType.LOAN:
            return "warning";
        case AccountType.RETIREMENT:
            return "secondary";
        case AccountType.ASSET:
            return "success";
        case AccountType.EXTERNAL:
            return "info";
        default:
            return "danger";
    }

}

function Account({ account }: { account: JAccount }) {
    return (
        <Card border={decideBorder(account)}>
            <Card.Body>
                <Card.Title>
                    {account.type} - {account.name}
                </Card.Title>
                <Card.Footer title={account.id}>
                    <FontAwesomeIcon icon={faPenToSquare}/>
                </Card.Footer>
            </Card.Body>
        </Card>
    );
}

export function Accounts() {
    const server = useAppSelector(selectServer);

    const [accounts, setAccounts] = useState<JAccount[]>([]);

    useEffect(() => {
        get<JAccount[]>(server, "/api/account/")
            .then(accounts => setAccounts(accounts))
            .catch(error => err(error));
    }, []);

    return (
        <Container>
            <Row xs={1} md={2} xl={3}>
                {accounts.map(account => <Account key={account.id} account={account} />)}
            </Row>
        </Container>
    )
}