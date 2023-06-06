import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { err, generateColorPalette, get, titleCase } from "../util/util";
import { Container, Form, Row } from "react-bootstrap";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import React from "react";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";

interface JRawAccountBalance {
    id: string,
    balance: number,
}

interface JRawBalances {
    localDate: string,
    cashBalance: number,
    liquidAssetsBalance: number,
    illiquidAssetsBalance: number,
    retirementBalance: number,
    liabilitiesBalance: number,
    net: number,
    accountBalances: JRawAccountBalance[],
}

interface JBalance extends JRawBalances {
    localDate: string,
    difference: JRawBalances,
}

enum ViewType {
    TOTALS = "TOTALS",
    ACCOUNTS = "ACCOUNTS",
}

enum DateType {
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
}

enum DataType {
    NET = "NET",
    DIFFERENCE = "DIFFERENCE",
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
                    <Line type="monotone" dataKey="net" stroke={dull("net", hiddenItems, totalColorPalette[0])} name="Net" />
                    <Line type="monotone" dataKey="cashBalance" stroke={dull("cashBalance", hiddenItems, totalColorPalette[1])} name="Cash" />
                    <Line type="monotone" dataKey="liquidAssetsBalance" stroke={dull("liquidAssetsBalance", hiddenItems, totalColorPalette[2])} name="Liquid Assets" />
                    <Line type="monotone" dataKey="illiquidAssetsBalance" stroke={dull("illiquidAssetsBalance", hiddenItems, totalColorPalette[3])} name="Illiquid Assets" />
                    <Line type="monotone" dataKey="retirementBalance" stroke={dull("retirementBalance", hiddenItems, totalColorPalette[4])} name="Retirement" />
                    <Line type="monotone" dataKey="liabilitiesBalance" stroke={dull("liabilitiesBalance", hiddenItems, totalColorPalette[5])} name="Liabilities" />
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
    }
}

function calculateBalances(viewType: ViewType, hiddenItems: string[], balances?: JRawBalances) {
    if (viewType === ViewType.TOTALS) {
        let filteredBalances: any = balances ? { ...balances } : {};
        hiddenItems.forEach(item => {
            delete filteredBalances[item];
        });
        return filteredBalances;
    } else {
        return (balances?.accountBalances ?? []).reduce<any>((acc, current) => {
            if (!hiddenItems.includes(current.id)) {
                acc[current.id] = current.balance;
            }
            return acc;
        }, {});
    }
}

function calculateData(viewType: ViewType, dataType: DataType, hiddenItems: string[], balance: JBalance): any {
    const date = balance.localDate.substring(5, balance.localDate.length);
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
                <Form.Group>
                    <Form.Label>View Type</Form.Label>
                    <Form.Select value={viewType} onChange={e => setViewType(e.target.value as ViewType)}>
                        {Object.keys(ViewType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Date Type</Form.Label>
                    <Form.Select value={dateType} onChange={e => setDateType(e.target.value as DateType)}>
                        {Object.keys(DateType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Data Type</Form.Label>
                    <Form.Select value={dataType} onChange={e => setDataType(e.target.value as DataType)}>
                        {Object.keys(DataType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
            </Row>
            <Row ref={widthRef} xl={1} className="justify-content-center">
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
            </Row>
        </Container>
    )
}