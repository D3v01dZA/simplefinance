import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { err, generateColorPalette, get, titleCase } from "../util/util";
import { Col, Container, Form, Row } from "react-bootstrap";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import React from "react";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";

interface JRawAccountBalance {
    accountId: string,
    balance: number,
    transfer: number,
}

interface JRawTotalBalance {
    type: string,
    balance: number,
    transfer: number,
}

interface JRawBalances {
    date: string,
    net: number,
    totalBalances: JRawTotalBalance[],
    accountBalances: JRawAccountBalance[],
}

interface JBalance extends JRawBalances {
    difference: JRawBalances,
}

enum ViewType {
    TOTALS = "TOTALS",
    TOTALS_TRANSFERS = "TOTALS_TRANSFERS",
    ACCOUNTS = "ACCOUNTS",
    ACCOUNTS_TRANSFERS = "ACCOUNTS_TRANSFERS",
}

enum DateType {
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
}

enum DataType {
    NET = "NET",
    DIFFERENCE = "DIFFERENCE",
}

enum TotalType {
    CASH = "CASH",
    LIQUID_ASSET = "LIQUID_ASSET",
    ILLIQUID_ASSET = "ILLIQUID_ASSET",
    RETIREMENT = "RETIREMENT",
    LIABILITY = "LIABILITY",
}

function url(dateType: DateType) {
    switch (dateType) {
        case DateType.MONTHLY:
            return "/api/monthly/";
        case DateType.WEEKLY:
            return "/api/weekly/";
    }
}

function dull(id: string, hiddenItems: string[], color: string) {
    if (hiddenItems.includes(id)) {
        return "#010101";
    }
    return color;
}

function lines(viewType: ViewType, hiddenItems: string[], accounts: IndexedAccounts) {
    switch (viewType) {
        case ViewType.TOTALS:
            const totalColorPalette = generateColorPalette(6);
            return (
                <React.Fragment>
                    <Line
                        type="monotone"
                        dataKey="net"
                        stroke={dull("net", hiddenItems, totalColorPalette[0])}
                        name="Net"
                    />
                    {Object.values(TotalType).map((totalType, index) => <Line
                        key={totalType}
                        type="monotone"
                        dataKey={totalType}
                        stroke={dull(totalType, hiddenItems, totalColorPalette[index + 1])}
                        name={titleCase(totalType)}
                    />)}
                </React.Fragment>
            );
        case ViewType.TOTALS_TRANSFERS:
            const totalsTransferColorPalette = generateColorPalette(5);
            return (
                <React.Fragment>
                    {Object.values(TotalType).map((totalType, index) => <Line
                        key={totalType}
                        type="monotone"
                        dataKey={totalType}
                        stroke={dull(totalType, hiddenItems, totalsTransferColorPalette[index])}
                        name={titleCase(totalType)}
                    />)}
                </React.Fragment>
            );
        case ViewType.ACCOUNTS:
            const accountColorPalette = generateColorPalette(Object.values(accounts).length);
            return (
                <React.Fragment>
                    {Object.values(accounts).map((account, index) => <Line
                        key={account.id}
                        type="monotone"
                        dataKey={account.id}
                        stroke={dull(account.id, hiddenItems, accountColorPalette[index])}
                        name={`${account.name} (${titleCase(account.type)})`}
                    />)}
                </React.Fragment>
            );
        case ViewType.ACCOUNTS_TRANSFERS:
            const accountTransfersColorPalette = generateColorPalette(Object.values(accounts).length);
            return (
                <React.Fragment>
                    {Object.values(accounts).map((account, index) => <Line
                        key={account.id}
                        type="monotone"
                        dataKey={account.id}
                        stroke={dull(account.id, hiddenItems, accountTransfersColorPalette[index])}
                        name={`${account.name} (${titleCase(account.type)})`}
                    />)}
                </React.Fragment>
            );
    }
}

function calculateBalances(viewType: ViewType, hiddenItems: string[], balances?: JRawBalances) {
    switch (viewType) {
        case ViewType.TOTALS:
            const main = (balances?.totalBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.includes(current.type)) {
                    acc[current.type] = current.balance;
                }
                return acc;
            }, {});
            return {
                ...main,
                net: balances?.net ?? 0
            }
        case ViewType.TOTALS_TRANSFERS:
            return (balances?.totalBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.includes(current.type)) {
                    acc[current.type] = current.transfer;
                }
                return acc;
            }, {});
        case ViewType.ACCOUNTS:
            return (balances?.accountBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.includes(current.accountId)) {
                    acc[current.accountId] = current.balance;
                }
                return acc;
            }, {});
        case ViewType.ACCOUNTS_TRANSFERS:
            return (balances?.accountBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.includes(current.accountId)) {
                    acc[current.accountId] = current.transfer;
                }
                return acc;
            }, {});
    }
}

function calculateData(viewType: ViewType, dataType: DataType, hiddenItems: string[], balance: JBalance): any {
    const date = balance.date.substring(5, balance.date.length);
    let calculated: any;
    if (dataType === DataType.NET) {
        calculated = calculateBalances(viewType, hiddenItems, balance);
    } else {
        calculated = calculateBalances(viewType, hiddenItems, balance.difference);
    }
    return {
        ...calculated,
        date
    }
}

export function Graphs() {
    const widthRef = useRef<HTMLDivElement>();
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const [viewType, setViewType] = useState(ViewType.TOTALS);
    const [dateType, setDateType] = useState(DateType.WEEKLY);
    const [dataType, setDataType] = useState(DataType.NET);

    const [hiddenItems, setHiddenItems] = useState<string[]>([]);

    const [data, setData] = useState<any[]>([]);
    const [balances, setBalances] = useState<JBalance[]>([]);

    useEffect(() => {
        get<JBalance[]>(server, url(dateType))
            .then(balances => setBalances(balances))
            .catch(error => err(error));
    }, [dateType]);

    useEffect(() => {
        setHiddenItems([]);
    }, [viewType]);

    useEffect(() => {
        const data = balances.map(balance => calculateData(viewType, dataType, hiddenItems, balance));
        setData(data);
    }, [balances, dataType, viewType, hiddenItems])

    return (
        <Container>
            <Row xs={1} md={2} xl={3}>
                <Col>
                    <Form.Group>
                        <Form.Label>View Type</Form.Label>
                        <Form.Select value={viewType} onChange={e => setViewType(e.target.value as ViewType)}>
                            {Object.keys(ViewType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col>
                    <Form.Group>
                        <Form.Label>Date Type</Form.Label>
                        <Form.Select value={dateType} onChange={e => setDateType(e.target.value as DateType)}>
                            {Object.keys(DateType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col>
                    <Form.Group>
                        <Form.Label>Data Type</Form.Label>
                        <Form.Select value={dataType} onChange={e => setDataType(e.target.value as DataType)}>
                            {Object.keys(DataType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            <Row ref={widthRef} xl={1} className="justify-content-center">
                <Col>
                    <LineChart width={(widthRef.current?.offsetWidth ?? 0) * 0.95} height={vh * 0.7} data={data}>
                        {lines(viewType, hiddenItems, accounts)}
                        <CartesianGrid stroke="#ccc" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Legend onClick={e => {
                            if (e.dataKey) {
                                if (hiddenItems.includes(e.dataKey)) {
                                    setHiddenItems(hiddenItems.filter(item => item !== e.dataKey))
                                } else {
                                    setHiddenItems(hiddenItems.concat(e.dataKey))
                                }
                            }
                        }} />
                        <Tooltip />
                    </LineChart>
                </Col>
            </Row>
        </Container>
    )
}