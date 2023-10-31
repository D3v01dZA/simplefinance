import { Col, Container, Row, Table } from "react-bootstrap";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { selectSettings } from "../app/settingSlice";
import { selectAccounts } from "../app/accountSlice";
import { useEffect, useState } from "react";
import { constrainedPage, err, get, titleCase } from "../util/util";
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination";
import { useSearchParams } from "react-router-dom";
import { AccountName } from "../util/common";


enum IssueType {
    TRANSFER_WITHOUT_BALANCE = "TRANSFER_WITHOUT_BALANCE",
}

interface JIssue {

    issueType: IssueType,
    accountId: string,
    transactionId: string,
    date: string,

}

export function Issues() {
    const [searchParams, _setSearchParams] = useSearchParams();

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const [issues, setIssues] = useState<JIssue[]>([]);

    const [pageSize, _setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [page, _setPage] = useState(0);

    function refreshIssues() {
        function sortIssues(issues: JIssue[]) {
            return issues.sort((left, right) => {
                let issueType = left.issueType.localeCompare(right.issueType);
                if (issueType != 0) {
                    return issueType;
                }
                let date = Date.parse(left.date) - Date.parse(right.date);
                if (date != 0) {
                    return date;
                }
                let accountId = left.accountId.localeCompare(right.accountId);
                if (accountId != 0) {
                    return accountId;
                }
                return left.transactionId.localeCompare(right.transactionId);
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
                            <th>Type</th>
                            <th>Date</th>
                            <th>Account</th>
                        </thead>
                        <tbody>
                            {issuesToDisplay().map(issue => (
                                <tr>
                                    <td>{titleCase(issue.issueType)}</td>
                                    <td>{issue.date}</td>
                                    <td><AccountName accounts={accounts} accountId={issue.accountId} /></td>
                                    <td></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination itemCount={issues.length} page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} />
                </Col>
            </Row>
        </Container>
    );
}