import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { err, generateColorPalette, get, titleCase } from "../util/util";
import { Col, Container, Form, Row } from "react-bootstrap";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import React from "react";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";
import { useSearchParams } from "react-router-dom";

interface JRawAccountBalance {
    accountId: string,
    balance: number,
    transfer: number,
}

interface JRawTotalBalance {
    type: string,
    balance: number,
    transfer: number,
    flow: number,
}

interface JRawFlowGrouping {
    type: string,
    value: number,
}

interface JRawBalances {
    date: string,
    net: number,
    totalBalances: JRawTotalBalance[],
    accountBalances: JRawAccountBalance[],
    flowGroupings: JRawFlowGrouping[],
}

interface JBalance extends JRawBalances {
    difference: JRawBalances,
}

enum ViewType {
    TOTALS = "TOTALS",
    TOTALS_TRANSFERS = "TOTALS_TRANSFERS",
    ACCOUNTS = "ACCOUNTS",
    ACCOUNTS_TRANSFERS = "ACCOUNTS_TRANSFERS",
    FLOW = "FLOW",
    FLOW_GROUPING = "FLOW_GROUPING",
}

enum FlowGroupingType {
    CASH = "CASH",
    GAIN = "GAIN",
    APPRECIATION = "APPRECIATION",
    INTEREST = "INTEREST",
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
    SHORT_TERM_ASSET = "SHORT_TERM_ASSET",
    LONG_TERM_ASSET = "LONG_TERM_ASSET",
    PHYSICAL_ASSET = "PHYSICAL_ASSET",
    RETIREMENT_ASSET = "RETIREMENT_ASSET",
    CASH_LIABILITY = "CASH_LIABILITY",
    SHORT_TERM_LIABILITY = "SHORT_TERM_LIABILITY",
    LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
}

function url(dateType: DateType) {
    switch (dateType) {
        case DateType.MONTHLY:
            return "/api/monthly/";
        case DateType.WEEKLY:
            return "/api/weekly/";
    }
}

function dull(id: string, hiddenItems: Set<string>, color: string) {
    if (hiddenItems.has(id)) {
        return "#010101";
    }
    return color;
}

function lines(viewType: ViewType, hiddenItems: Set<string>, accounts: IndexedAccounts) {
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
        case ViewType.FLOW:
            const flowColorPalette = generateColorPalette(6);
            return (
                <React.Fragment>
                    {Object.values(TotalType).map((totalType, index) => <Line
                        key={totalType}
                        type="monotone"
                        dataKey={totalType}
                        stroke={dull(totalType, hiddenItems, flowColorPalette[index + 1])}
                        name={titleCase(totalType)}
                    />)}
                </React.Fragment>
            );
        case ViewType.FLOW_GROUPING:
            const flowGoupingColorPalette = generateColorPalette(6);
            return (
                <React.Fragment>
                    {Object.values(FlowGroupingType).map((flowGroupingType, index) => <Line
                        key={flowGroupingType}
                        type="monotone"
                        dataKey={flowGroupingType}
                        stroke={dull(flowGroupingType, hiddenItems, flowGoupingColorPalette[index + 1])}
                        name={titleCase(flowGroupingType)}
                    />)}
                </React.Fragment>
            );
    }
}

function calculateBalances(viewType: ViewType, hiddenItems: Set<string>, balances?: JRawBalances) {
    switch (viewType) {
        case ViewType.TOTALS:
            const main = (balances?.totalBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.has(current.type)) {
                    acc[current.type] = current.balance;
                }
                return acc;
            }, {});
            if (hiddenItems.has("net")) {
                return {
                    ...main
                }
            }
            return {
                ...main,
                net: balances?.net ?? 0
            }
        case ViewType.TOTALS_TRANSFERS:
            return (balances?.totalBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.has(current.type)) {
                    acc[current.type] = current.transfer;
                }
                return acc;
            }, {});
        case ViewType.ACCOUNTS:
            return (balances?.accountBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.has(current.accountId)) {
                    acc[current.accountId] = current.balance;
                }
                return acc;
            }, {});
        case ViewType.ACCOUNTS_TRANSFERS:
            return (balances?.accountBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.has(current.accountId)) {
                    acc[current.accountId] = current.transfer;
                }
                return acc;
            }, {});
        case ViewType.FLOW:
            return (balances?.totalBalances ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.has(current.type)) {
                    acc[current.type] = current.flow;
                }
                return acc;
            }, {});
        case ViewType.FLOW_GROUPING:
            return (balances?.flowGroupings ?? []).reduce<any>((acc, current) => {
                if (!hiddenItems.has(current.type)) {
                    acc[current.type] = current.value;
                }
                return acc;
            }, {});
    }
}

function calculateData(viewType: ViewType, dataType: DataType, hiddenItems: Set<string>, balance: JBalance): any {
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
    const [searchParams, _setSearchParams] = useSearchParams();
    const widthRef = useRef<HTMLDivElement>();
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const [viewType, _setViewType] = useState(ViewType.TOTALS);
    const [dateType, _setDateType] = useState(DateType.WEEKLY);
    const [dataType, _setDataType] = useState(DataType.NET);

    const [hiddenItems, _setHiddenItems] = useState(new Set<string>());

    const [data, setData] = useState<any[]>([]);
    const [balances, setBalances] = useState<JBalance[]>([]);

    function setSearchParams(key: string, value: string | number | undefined | string[]) {
        if (Array.isArray(value)) {
            searchParams.delete(key);
            value.forEach(val => searchParams.append(key, val));
        } else if (value === undefined || value === "" || value === "none" || value === 1) {
            searchParams.delete(key);
        } else {
            searchParams.set(key, value + "");
        }
        _setSearchParams(searchParams);
    }

    function setViewType(viewType: ViewType) {
        if (viewType === ViewType.TOTALS) {
            setSearchParams("viewType", undefined);
        } else {
            setSearchParams("viewType", viewType);
        }
    }

    function setDateType(dateType: DateType) {
        if (dateType === DateType.WEEKLY) {
            setSearchParams("dateType", undefined);
        } else {
            setSearchParams("dateType", dateType);
        }
    }

    function setDataType(dataType: DataType) {
        if (dataType === DataType.NET) {
            setSearchParams("dataType", undefined);
        } else {
            setSearchParams("dataType", dataType);
        }
    }

    function setHiddenItems(hiddenItems: Set<string>) {
        if (hiddenItems.size === 0) {
            setSearchParams("hiddenItems", undefined);
        } else {
            setSearchParams("hiddenItems", [...hiddenItems]);
        }
    }

    useEffect(() => {
        const _viewType = searchParams.get("viewType");
        if (_viewType !== null) {
            _setViewType(_viewType as ViewType);
        } else {
            _setViewType(ViewType.TOTALS);
        }
        const _dateType = searchParams.get("dateType");
        if (_dateType !== null) {
            _setDateType(_dateType as DateType);
        } else {
            _setDateType(DateType.WEEKLY);
        }
        const _dataType = searchParams.get("dataType");
        if (_dataType != null) {
            _setDataType(_dataType as DataType);
        } else {
            _setDataType(DataType.NET);
        }
        const _hiddenItems = searchParams.getAll("hiddenItems");
        if (_hiddenItems !== null) {
            _setHiddenItems(new Set(_hiddenItems));
        } else {
            _setHiddenItems(new Set());
        }
    }, [searchParams]);

    useEffect(() => {
        get<JBalance[]>(server, url(dateType))
            .then(balances => setBalances(balances))
            .catch(error => err(error));
    }, [dateType]);

    useEffect(() => {
        setHiddenItems(new Set());
    }, [viewType]);

    useEffect(() => {
        const data = balances.map(balance => calculateData(viewType, dataType, hiddenItems, balance));
        setData(data);
    }, [balances, dataType, viewType, hiddenItems]);

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
                                if (hiddenItems.has(e.dataKey)) {
                                    const replaced = new Set<string>(hiddenItems);
                                    replaced.delete(e.dataKey);
                                    setHiddenItems(replaced);
                                } else {
                                    const replaced = new Set<string>(hiddenItems);
                                    replaced.add(e.dataKey);
                                    setHiddenItems(replaced);
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