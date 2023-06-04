import React from "react";
import { Container, Nav, Navbar, Row } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { LinkContainer } from 'react-router-bootstrap';

export function Header() {
    return (
        <React.Fragment>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand>Simple Finance</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <LinkContainer to="home">
                                <Nav.Link href="/home">Home</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="accounts">
                                <Nav.Link href="/accounts">Accounts</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="balances">
                                <Nav.Link href="/balances">Balances</Nav.Link>
                            </LinkContainer>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Outlet />
        </React.Fragment>
    );
}