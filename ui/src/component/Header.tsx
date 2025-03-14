import React, { useEffect } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { LinkContainer } from 'react-router-bootstrap';
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { err, get } from "../util/util";
import { JAccount, setAccounts } from "../app/accountSlice";
import { JSetting, setSettings } from "../app/settingSlice";

export function Header() {   
    const server = useAppSelector(selectServer);

    const dispatch = useAppDispatch();

    function refreshAccounts() {
        function sortAccounts(accounts: JAccount[]) {
            return accounts.sort((left, right) => left.name.localeCompare(right.name));
        }

        get<JAccount[]>(server, "/api/account/")
            .then(accounts => dispatch(setAccounts(sortAccounts(accounts))))
            .catch(error => err(error));
    }

    function refreshSettings() {
        get<JSetting[]>(server, "/api/setting/")
            .then(settings => dispatch(setSettings(settings)))
            .catch(error => err(error));
    }

    useEffect(() => {
        refreshSettings();
        refreshAccounts();
    }, []);

    return (
        <React.Fragment>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand>Simple Finance</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <LinkContainer to="/accounts">
                                <Nav.Link>Accounts</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/transactions">
                                <Nav.Link>Transactions</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/expenses">
                                <Nav.Link>Expenses</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/issues">
                                <Nav.Link>Issues</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/statistics">
                                <Nav.Link>Statistics</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/settings">
                                <Nav.Link>Settings</Nav.Link>
                            </LinkContainer>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Outlet />
        </React.Fragment>
    );
}
