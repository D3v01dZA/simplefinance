import React, { useEffect } from "react";
import { Container, Nav, Navbar, Row } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { LinkContainer } from 'react-router-bootstrap';
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { err, get } from "../util/util";
import { JAccount, setAccounts } from "../app/accountSlice";

export function Header() {   
    const server = useAppSelector(selectServer);

    const dispatch = useAppDispatch();

    function refreshAccounts() {
        get<JAccount[]>(server, "/api/account/")
            .then(accounts => dispatch(setAccounts(accounts)))
            .catch(error => err(error));
    }

    useEffect(() => refreshAccounts(), []);

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
                            <LinkContainer to="/graphs">
                                <Nav.Link>Graphs</Nav.Link>
                            </LinkContainer>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Outlet />
        </React.Fragment>
    );
}