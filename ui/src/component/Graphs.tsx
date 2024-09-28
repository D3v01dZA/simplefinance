import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { accountTitle, err, formattedAmount, formattedUnknownAmount, generateColorPalette, get, titleCase } from "../util/util";
import { Col, Container, Form, Row, Table } from "react-bootstrap";
import { CartesianGrid, Layer, Legend, Line, LineChart, Rectangle, Sankey, Tooltip, XAxis, YAxis } from "recharts";
import React from "react";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";
import { useSearchParams } from "react-router-dom";
import { ExpenseCategory } from "./Expenses";

interface JValue {
    name: string,
    value: number,
    value_difference: number,
}

interface JStatistic {
    date: string,
    values: Array<JValue>
}

enum ViewType {
    TOTAL_BALANCE = "TOTAL_BALANCE",
    TOTAL_TRANSFER = "TOTAL_TRANSFER",
    ACCOUNT_BALANCE = "ACCOUNT_BALANCE",
    ACCOUNT_TRANSFER = "ACCOUNT_TRANSFER",
    FLOW = "FLOW",
    FLOW_GROUPING = "FLOW_GROUPING",
    EXPENSES = "EXPENSES",
}

enum GraphType {
    LINE = "LINE",
    TABLE = "TABLE",
}

enum FlowGroupingType {
    NET = "NET",
    INCOME = "INCOME",
    CASH = "CASH",
    GAIN = "GAIN",
    APPRECIATION = "APPRECIATION",
}

enum DateType {
    YEARLY = "YEARLY",
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
}

enum DataType {
    NET = "NET",
    DIFFERENCE = "DIFFERENCE",
}

enum TotalType {
    INCOME = "INCOME",
    NET = "NET",
    CASH = "CASH",
    SHORT_TERM_ASSET = "SHORT_TERM_ASSET",
    LONG_TERM_ASSET = "LONG_TERM_ASSET",
    PHYSICAL_ASSET = "PHYSICAL_ASSET",
    RETIREMENT_ASSET = "RETIREMENT_ASSET",
    SHORT_TERM_LIABILITY = "SHORT_TERM_LIABILITY",
    LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
}

function url(dateType: DateType, viewType: ViewType) {
    let subpath = ""
    console.log(viewType)
    switch (viewType) {
        case ViewType.TOTAL_BALANCE:
            subpath = "/total_balance/"
            break;
        case ViewType.TOTAL_TRANSFER:
            subpath = "/total_transfer/"
            break;
        case ViewType.ACCOUNT_BALANCE:
            subpath = "/account_balance/"
            break;
        case ViewType.ACCOUNT_TRANSFER:
            subpath = "/account_transfer/"
            break;
        case ViewType.FLOW:
            subpath = "/flow/"
            break;
        case ViewType.FLOW_GROUPING:
            subpath = "/flow_grouping/"
            break;
        case ViewType.EXPENSES:
            subpath = "/expenses/"
            break;
    }
    switch (dateType) {
        case DateType.MONTHLY:
            return "/api/statistics/monthly" + subpath;
        case DateType.WEEKLY:
            return "/api/statistics/weekly" + subpath;
        case DateType.YEARLY:
            return "/api/statistics/yearly" + subpath;
    }
}

function dull(id: string, shownLines: Set<string>, color: string) {
    if (shownLines.size !== 0 && !shownLines.has(id)) {
        return "#010101";
    }
    return color;
}

function lines(viewType: ViewType, shownLines: Set<string>, accounts: IndexedAccounts) {
    switch (viewType) {
        case ViewType.TOTAL_BALANCE:
            const totalColorPalette = generateColorPalette(1 + Object.values(TotalType).length);
            return (
                <React.Fragment>
                    {Object.values(TotalType).map((totalType, index) => <Line
                        key={totalType}
                        type="monotone"
                        dataKey={totalType}
                        stroke={dull(totalType, shownLines, totalColorPalette[index + 1])}
                        name={titleCase(totalType)}
                    />)}
                </React.Fragment>
            );
        case ViewType.TOTAL_TRANSFER:
            const totalsTransferColorPalette = generateColorPalette(1 + Object.values(TotalType).length);
            return (
                <React.Fragment>
                    {Object.values(TotalType).map((totalType, index) => <Line
                        key={totalType}
                        type="monotone"
                        dataKey={totalType}
                        stroke={dull(totalType, shownLines, totalsTransferColorPalette[index])}
                        name={titleCase(totalType)}
                    />)}
                </React.Fragment>
            );
        case ViewType.ACCOUNT_BALANCE:
            const accountColorPalette = generateColorPalette(Object.values(accounts).length);
            return (
                <React.Fragment>
                    {Object.values(accounts).map((account, index) => <Line
                        key={account.id}
                        type="monotone"
                        dataKey={account.id}
                        stroke={dull(account.id, shownLines, accountColorPalette[index])}
                        name={`${account.name} (${titleCase(account.type)})`}
                    />)}
                </React.Fragment>
            );
        case ViewType.ACCOUNT_TRANSFER:
            const accountTransfersColorPalette = generateColorPalette(Object.values(accounts).length);
            return (
                <React.Fragment>
                    {Object.values(accounts).map((account, index) => <Line
                        key={account.id}
                        type="monotone"
                        dataKey={account.id}
                        stroke={dull(account.id, shownLines, accountTransfersColorPalette[index])}
                        name={`${account.name} (${titleCase(account.type)})`}
                    />)}
                </React.Fragment>
            );
        case ViewType.FLOW:
            const flowColorPalette = generateColorPalette(1 + Object.values(TotalType).length);
            return (
                <React.Fragment>
                    {Object.values(TotalType).map((totalType, index) => <Line
                        key={totalType}
                        type="monotone"
                        dataKey={totalType}
                        stroke={dull(totalType, shownLines, flowColorPalette[index + 1])}
                        name={titleCase(totalType)}
                    />)}
                </React.Fragment>
            );
        case ViewType.FLOW_GROUPING:
            const flowGoupingColorPalette = generateColorPalette(1 + Object.values(FlowGroupingType).length);
            return (
                <React.Fragment>
                    {Object.values(FlowGroupingType).map((flowGroupingType, index) => <Line
                        key={flowGroupingType}
                        type="monotone"
                        dataKey={flowGroupingType}
                        stroke={dull(flowGroupingType, shownLines, flowGoupingColorPalette[index + 1])}
                        name={titleCase(flowGroupingType)}
                    />)}
                </React.Fragment>
            );
        case ViewType.EXPENSES:
            const expensesColorPalette = generateColorPalette(Object.values(ExpenseCategory).length + 2);
            return (
                <React.Fragment>
                  {([...Object.values(ExpenseCategory)] as string[]).concat("TOTAL").concat("CASH").map((category, index) => <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={dull(category, shownLines, expensesColorPalette[index + 1])}
                      name={titleCase(category)}
                  />)}
                </React.Fragment>
            )
    }
}

function calculateBalances(shownLines: Set<string>, balances: JStatistic, dataType: DataType) {
    const main = balances.values.reduce<any>((acc, current) => {
        if (shownLines.size === 0 || shownLines.has(current.name)) {
            if (dataType === DataType.NET) {
                acc[current.name] = current.value;
            } else {
                acc[current.name] = current.value_difference;
            }
        }
        return acc;
    }, {});
    return {
        ...main
    }
}

function calculateData(dataType: DataType, shownLines: Set<string>, statistic: JStatistic): any {
    const date = statistic.date.substring(2, statistic.date.length);
    let calculated: any = calculateBalances(shownLines, statistic, dataType);
    return {
        ...calculated,
        date
    }
}

export function Graphs() {
    const DEFAULT_GRAPH_TYPE = GraphType.LINE;
    const DEFAULT_VIEW_TYPE = ViewType.FLOW_GROUPING;
    const DEFAULT_DATE_TYPE = DateType.MONTHLY;
    const DEFAULT_DATA_TYPE = DataType.DIFFERENCE;

    const [searchParams, _setSearchParams] = useSearchParams();
    const widthRef = useRef<HTMLDivElement>();
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const [graphType, _setGraphType] = useState(DEFAULT_GRAPH_TYPE);
    const [lineStartDate, setLineStartDate] = useState("");
    const [lineEndDate, setLineEndDate] = useState("");
    const [viewType, _setViewType] = useState(DEFAULT_VIEW_TYPE);
    const [dateType, _setDateType] = useState(DEFAULT_DATE_TYPE);
    const [dataType, _setDataType] = useState(DEFAULT_DATA_TYPE);

    const [shownLines, _setShownLines] = useState(new Set<string>());

    const [data, setData] = useState<any[]>([]);
    const [statistics, setStatistics] = useState<JStatistic[]>([]);

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

    function setGraphType(graphType: GraphType) {
        if (graphType === DEFAULT_GRAPH_TYPE) {
            setSearchParams("graphType", undefined);
        } else {
            setSearchParams("graphType", graphType);
        }
    }

    function setViewType(viewType: ViewType) {
        if (viewType === DEFAULT_VIEW_TYPE) {
            setSearchParams("viewType", undefined);
        } else {
            setSearchParams("viewType", viewType);
        }
    }

    function setDateType(dateType: DateType) {
        if (dateType === DEFAULT_DATE_TYPE) {
            setSearchParams("dateType", undefined);
        } else {
            setSearchParams("dateType", dateType);
        }
    }

    function setDataType(dataType: DataType) {
        if (dataType === DEFAULT_DATA_TYPE) {
            setSearchParams("dataType", undefined);
        } else {
            setSearchParams("dataType", dataType);
        }
    }

    function setShownLines(shownLines: Set<string>) {
        if (shownLines.size === 0) {
            setSearchParams("shownLines", undefined);
        } else {
            setSearchParams("shownLines", [...shownLines]);
        }
    }

    useEffect(() => {
        const _graphType = searchParams.get("graphType");
        if (_graphType !== null) {
            _setGraphType(_graphType as GraphType);
        } else {
            _setGraphType(DEFAULT_GRAPH_TYPE);
        }
        const _viewType = searchParams.get("viewType");
        if (_viewType !== null) {
            _setViewType(_viewType as ViewType);
        } else {
            _setViewType(DEFAULT_VIEW_TYPE);
        }
        const _dateType = searchParams.get("dateType");
        if (_dateType !== null) {
            _setDateType(_dateType as DateType);
        } else {
            _setDateType(DEFAULT_DATE_TYPE);
        }
        const _dataType = searchParams.get("dataType");
        if (_dataType != null) {
            _setDataType(_dataType as DataType);
        } else {
            _setDataType(DEFAULT_DATA_TYPE);
        }
        const _shownLines = searchParams.getAll("shownLines");
        if (_shownLines !== null) {
            _setShownLines(new Set(_shownLines));
        } else {
            _setShownLines(new Set());
        }
    }, [searchParams]);

    useEffect(() => {
        get<JStatistic[]>(server, url(dateType, viewType))
            .then(balances => setStatistics(balances))
            .catch(error => err(error));
    }, [dateType, viewType]);

    useEffect(() => {
        setShownLines(new Set());
    }, [viewType]);

    useEffect(() => {
        const startDate = lineStartDate === "" ? statistics.length === 0 ? new Date() : new Date(statistics[Math.max(0, statistics.length - 10)].date) : new Date(lineStartDate);
        const endDate = lineEndDate === "" ? statistics.length === 0 ? new Date() : new Date(statistics[Math.max(statistics.length - 1)].date) : new Date(lineEndDate);
        const data = statistics
            .filter(statistic => {
                const date = new Date(statistic.date);
                return date >= startDate && date <= endDate;
            })
            .map(statistic => calculateData(dataType, shownLines, statistic));
        setData(data);
    }, [statistics, lineStartDate, lineEndDate, dataType, viewType, shownLines]);

    return (
        <Container>
            <Row xs={1} md={1} xl={1}>
                <Col>
                    <Form.Group>
                        <Form.Label>Graph Type</Form.Label>
                        <Form.Select value={graphType} onChange={e => setGraphType(e.target.value as GraphType)}>
                            {Object.keys(GraphType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            {
                <Row xs={1} md={2} xl={2}>
                    <Col>
                        <Form.Group>
                            <Form.Label>Start Date</Form.Label>
                            <Form.Select value={lineStartDate} onChange={e => setLineStartDate(e.target.value)}>
                                {[<option value=""></option>].concat(statistics.map(balance => <option key={balance.date} value={balance.date}>{balance.date}</option>))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>End Date</Form.Label>
                            <Form.Select value={lineEndDate} onChange={e => setLineEndDate(e.target.value)}>
                                {[<option value=""></option>].concat(statistics.map(balance => <option key={balance.date} value={balance.date}>{balance.date}</option>))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
            }
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
                    {
                        graphType === GraphType.LINE ? <LineChart width={(widthRef.current?.offsetWidth ?? 0) * 0.95} height={vh * 0.7} margin={{ top: 40, left: 65, right: 5, bottom: 5 }} data={data}>
                            {lines(viewType, shownLines, accounts)}
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" />~
                            <YAxis tickFormatter={(value: any) => formattedUnknownAmount(value)} />
                            <Legend onClick={e => {
                                if (e.dataKey) {
                                    if (shownLines.has(e.dataKey)) {
                                        const replaced = new Set<string>(shownLines);
                                        replaced.delete(e.dataKey);
                                        setShownLines(replaced);
                                    } else {
                                        const replaced = new Set<string>(shownLines);
                                        replaced.add(e.dataKey);
                                        setShownLines(replaced);
                                    }
                                }
                            }} />
                            <Tooltip formatter={(value: any) => formattedAmount(value)} />
                        </LineChart> : <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <td>Date</td>
                                </tr>
                            </thead>
                        </Table>
                    }
                </Col>
            </Row>
        </Container>
    )
}
