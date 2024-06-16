import { Button, Col, Container, Row, Table } from "react-bootstrap";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { selectSettings } from "../app/settingSlice";
import { selectAccounts } from "../app/accountSlice";
import { useEffect, useState } from "react";
import { constrainedPage, err, get, post, titleCase } from "../util/util";
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination";
import { useSearchParams } from "react-router-dom";
import { AccountName } from "../util/common";
import { TransactionModal, WorkingTransaction } from "./sub-component/TransactionModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWrench } from "@fortawesome/free-solid-svg-icons";
import { TransactionType } from "./Transactions";


enum IssueType {
    TRANSFER_WITHOUT_BALANCE = "TRANSFER_WITHOUT_BALANCE",
}

interface JIssue {

    type: IssueType,
    accountId: string,
    date: string,

}

export function Issues() {
    const [searchParams, _setSearchParams] = useSearchParams();

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);
    const settings = useAppSelector(selectSettings);

    const [issues, setIssues] = useState<JIssue[]>([]);

    const [pageSize, _setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [page, _setPage] = useState(0);

    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [savingTransaction, setSavingTransaction] = useState(false);
    const [transaction, setTransaction] = useState<Partial<WorkingTransaction>>({});

    function refreshIssues() {
        function sortIssues(issues: JIssue[]) {
            return issues.sort((left, right) => {
                let issueType = right.type.localeCompare(left.type);
                if (issueType != 0) {
                    return issueType;
                }
                let date = Date.parse(right.date) - Date.parse(left.date);
                if (date != 0) {
                    return date;
                }
                return right.accountId.localeCompare(left.accountId);
            });
        }

        get<JIssue[]>(server, `/api/issue/`)
                .then(issues => setIssues(sortIssues(issues)))
                .catch(error => err(error));
    }

    function issuesToDisplay() {
        if (pageSize === 0) {
            return issues;
        }
        return issues.slice(pageSize * page, pageSize * page + pageSize);
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
        const constrained = constrainedPage(issues.length, pageSize, newPage);
        setSearchParams("page", constrained + 1);
    }

    function setPageSize(pageSize: number) {
        if (pageSize === DEFAULT_PAGE_SIZE) {
            setSearchParams("pageSize", undefined);
        } else {
            setSearchParams("pageSize", pageSize);
        }
    }

    useEffect(() => refreshIssues(), []);

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
                                <th>Type</th>
                                <th>Date</th>
                                <th>Account</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issuesToDisplay().map(issue => (
                                <tr>
                                    <td>{titleCase(issue.type)}</td>
                                    <td>{issue.date}</td>
                                    <td><AccountName accounts={accounts} accountId={issue.accountId} /></td>
                                    <td>
                                        <Button variant="primary" onClick={() => {
                                            setTransaction({
                                                date: issue.date,
                                                description: "",
                                                type: TransactionType.BALANCE,
                                                accountId: issue.accountId,
                                            });
                                            setShowTransactionModal(true);
                                        }}>
                                            <FontAwesomeIcon icon={faWrench} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination itemCount={issues.length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
                    <TransactionModal accounts={accounts} settings={settings} singleAccount={true} singleType={true} singleDate={true} show={showTransactionModal} setShow={setShowTransactionModal} transaction={transaction} setTransaction={setTransaction} saving={savingTransaction} save={() => {
                            setSavingTransaction(true);
                            post(server, `/api/transaction/`, transaction)
                                .then(() => refreshIssues())
                                .catch(error => err(error))
                                .finally(() => {
                                    setSavingTransaction(false);
                                    setShowTransactionModal(false);
                                });
                        }
                    }/>
                </Col>
            </Row>
        </Container>
    );
}