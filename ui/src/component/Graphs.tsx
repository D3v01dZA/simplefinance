import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { accountTitle, err, generateColorPalette, get, titleCase } from "../util/util";
import { Col, Container, Form, Row } from "react-bootstrap";
import { CartesianGrid, Layer, Legend, Line, LineChart, Rectangle, Sankey, Tooltip, XAxis, YAxis } from "recharts";
import React from "react";
import { IndexedAccounts, selectAccounts } from "../app/accountSlice";
import { useSearchParams } from "react-router-dom";

interface JRawAccountBalance {
    accountId: string,
    balance: number,
    transfer: number,
}

interface JRawTotalBalance {
    type: TotalType,
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

enum GraphType {
    LINE = "LINE",
    SANKEY = "SANKEY",
}

enum FlowGroupingType {
    EXTERNAL = "EXTERNAL",
    CASH = "CASH",
    GAIN = "GAIN",
    RETIREMENT = "RETIREMENT",
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
    EXTERNAL = "EXTERNAL",
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

interface LinkDataItem {
    source: number,
    target: number,
    value: number,
    color: string,
}

interface Node {
    name: string,
    color: string,
}

interface SankeyData {
    nodes: Node[];
    links: LinkDataItem[];
}

const EMPTY_SANKEY = { "nodes": [{ "name": "EMPTY", "color": "" }, { "name": "EMPTY", "color": "" },], "links": [{ "source": 0, "target": 1, "value": 1, "color": "" },] }

function lines(viewType: ViewType, hiddenItems: Set<string>, accounts: IndexedAccounts) {
    switch (viewType) {
        case ViewType.TOTALS:
            const totalColorPalette = generateColorPalette(1 + Object.values(TotalType).length);
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
            const totalsTransferColorPalette = generateColorPalette(1 + Object.values(TotalType).length);
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
            const flowColorPalette = generateColorPalette(1 + Object.values(TotalType).length);
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
            const flowGoupingColorPalette = generateColorPalette(1 + Object.values(FlowGroupingType).length);
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

function calculateSankey(viewType: ViewType, dataType: DataType, accounts: IndexedAccounts, raw: JBalance): SankeyData {
    const net = dataType === DataType.NET;
    if (raw === undefined) {
        return EMPTY_SANKEY;
    }
    let balance;
    if (net) {
        balance = raw;
    } else {
        balance = raw.difference;
    }
    if (balance === undefined) {
        return EMPTY_SANKEY
    }

    const nodes: Node[] = [];
    const links: LinkDataItem[] = [];
    if (viewType === ViewType.TOTALS || viewType == ViewType.TOTALS_TRANSFERS || viewType == ViewType.FLOW) {
        function decideAsset() {
            if (viewType == ViewType.TOTALS) {
                return net ? "Assets" : "Increase"
            }
            return "Income"
        }

        function decideLiability() {
            if (viewType == ViewType.TOTALS) {
                return net ? "Liabilities" : "Decrease"
            } 
            return "Expense"
        }

        const totalColorPalette = generateColorPalette(4 + Object.values(TotalType).length);
        const nodeNameToIndex: { [name: string]: number } = {};
        nodes.push({ name: "Total " + decideAsset(), color: totalColorPalette[nodes.length] })
        nodes.push({ name: "Total " + decideLiability(), color: totalColorPalette[nodes.length] })
        nodes.push({ name: decideAsset(), color: totalColorPalette[nodes.length] })
        nodes.push({ name: decideLiability(), color: totalColorPalette[nodes.length] })
        Object.values(TotalType).forEach((totalType) => {
            nodes.push({ name: titleCase(totalType), color: totalColorPalette[nodes.length] });
            nodeNameToIndex[totalType] = nodes.length - 1;
        });

        let assets = 0;
        let liabilities = 0;


        balance.totalBalances.forEach((total) => {
            let value;
            if (viewType === ViewType.TOTALS) {
                value = total.balance;
            } else if (viewType === ViewType.TOTALS_TRANSFERS) {
                value = total.transfer;
            } else {
                value = total.flow;
            }
            if (value > 0) {
                assets += value;
                links.push({
                    source: 2,
                    target: nodeNameToIndex[total.type],
                    value: value,
                    color: totalColorPalette[nodeNameToIndex[total.type]]
                })
            } else if (value < 0) {
                liabilities -= value;
                links.push({
                    source: 3,
                    target: nodeNameToIndex[total.type],
                    value: -value,
                    color: totalColorPalette[nodeNameToIndex[total.type]]
                })
            }
        })

        links.push({
            source: 0,
            target: 2,
            value: assets,
            color: totalColorPalette[1]
        })
        links.push({
            source: 1,
            target: 3,
            value: liabilities,
            color: totalColorPalette[2]
        })

        return { nodes, links }
    } else if (viewType === ViewType.ACCOUNTS || viewType == ViewType.ACCOUNTS_TRANSFERS) {
        function decideAsset() {
            if (viewType == ViewType.ACCOUNTS) {
                return net ? "Assets" : "Increase"
            }
            return "Income"
        }

        function decideLiability() {
            if (viewType == ViewType.ACCOUNTS) {
                return net ? "Liabilities" : "Decrease"
            } 
            return "Expense"
        }

        const totalColorPalette = generateColorPalette(3 + balance.accountBalances.length);
        nodes.push({ name: "Total " + decideAsset(), color: totalColorPalette[nodes.length] })
        nodes.push({ name: "Total " + decideLiability(), color: totalColorPalette[nodes.length] })
        nodes.push({ name: decideAsset(), color: totalColorPalette[nodes.length] })
        nodes.push({ name: decideLiability(), color: totalColorPalette[nodes.length] })

        let assets = 0;
        let liabilities = 0;

        balance.accountBalances.forEach((account) => {
            nodes.push({ name: accountTitle(account.accountId, accounts), color: totalColorPalette[nodes.length] });
            let value;
            if (viewType === ViewType.ACCOUNTS) {
                value = account.balance;
            } else {
                value = account.transfer;
            }
            if (value > 0) {
                assets += value;
                links.push({
                    source: 2,
                    target: nodes.length - 1,
                    value: value,
                    color: totalColorPalette[nodes.length - 1]
                })
            } else if (value < 0) {
                liabilities -= value;
                links.push({
                    source: 3,
                    target: nodes.length - 1,
                    value: -value,
                    color: totalColorPalette[nodes.length - 1]
                })
            }
        })

        links.push({
            source: 0,
            target: 2,
            value: assets,
            color: totalColorPalette[1]
        })
        links.push({
            source: 1,
            target: 3,
            value: liabilities,
            color: totalColorPalette[2]
        })

        return { nodes, links }
    } else if (viewType == ViewType.FLOW_GROUPING) {
        const totalColorPalette = generateColorPalette(4 + balance.flowGroupings.length);
        nodes.push({ name: "Total Income", color: totalColorPalette[nodes.length] })
        nodes.push({ name: "Total Expense", color: totalColorPalette[nodes.length] })
        nodes.push({ name: "Income", color: totalColorPalette[nodes.length] })
        nodes.push({ name: "Expense", color: totalColorPalette[nodes.length] })

        let assets = 0;
        let liabilities = 0;

        balance.flowGroupings.forEach((flow) => {
            nodes.push({ name: titleCase(flow.type), color: totalColorPalette[nodes.length] });
            let value = flow.value;
            if (value > 0) {
                assets += value;
                links.push({
                    source: 2,
                    target: nodes.length - 1,
                    value: value,
                    color: totalColorPalette[nodes.length - 1]
                })
            } else if (value < 0) {
                liabilities -= value;
                links.push({
                    source: 3,
                    target: nodes.length - 1,
                    value: -value,
                    color: totalColorPalette[nodes.length - 1]
                })
            }
        })

        links.push({
            source: 0,
            target: 2,
            value: assets,
            color: totalColorPalette[1]
        })
        links.push({
            source: 1,
            target: 3,
            value: liabilities,
            color: totalColorPalette[2]
        })

        return { nodes, links }
    }
    return EMPTY_SANKEY
}

function SankeyNode({ x, y, width, height, index, payload, containerWidth, }: any) {
    const isOut = x + width + 6 > containerWidth;
    return (
        (
            <Layer key={`CustomNode${index}`}>
                <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={payload.color}
                    fillOpacity="1"
                />

                <text
                    textAnchor={isOut ? "end" : "start"}
                    x={isOut ? x - 6 : x + width + 6}
                    y={y + height / 2}
                    fontSize="14"
                    stroke="#333"
                >
                    {payload.name}
                </text>
                <text
                    textAnchor={isOut ? "end" : "start"}
                    x={isOut ? x - 6 : x + width + 6}
                    y={y + height / 2 + 13}
                    fontSize="12"
                    stroke="#333"
                    strokeOpacity="0.5"
                >
                    {payload.value + "k"}
                </text>
            </Layer>
        )
    )
}

function SankeyLink({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, payload }: any) {
    return (
        <Layer key={`CustomLink${index}`}>
            <path
                d={`
              M${sourceX},${sourceY + linkWidth / 2}
              C${sourceControlX},${sourceY + linkWidth / 2}
                ${targetControlX},${targetY + linkWidth / 2}
                ${targetX},${targetY + linkWidth / 2}
              L${targetX},${targetY - linkWidth / 2}
              C${targetControlX},${targetY - linkWidth / 2}
                ${sourceControlX},${sourceY - linkWidth / 2}
                ${sourceX},${sourceY - linkWidth / 2}
              Z
            `}
                fill={payload.color}
                strokeWidth="0"
            />
        </Layer>
    );
}

export function Graphs() {
    const DEFAULT_GRAPH_TYPE = GraphType.LINE;
    const DEFAULT_VIEW_TYPE = ViewType.TOTALS;
    const DEFAULT_DATE_TYPE = DateType.WEEKLY;
    const DEFAULT_DATA_TYPE = DataType.DIFFERENCE;

    const [searchParams, _setSearchParams] = useSearchParams();
    const widthRef = useRef<HTMLDivElement>();
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);

    const [graphType, _setGraphType] = useState(DEFAULT_GRAPH_TYPE);
    const [viewType, _setViewType] = useState(DEFAULT_VIEW_TYPE);
    const [dateType, _setDateType] = useState(DEFAULT_DATE_TYPE);
    const [dataType, _setDataType] = useState(DEFAULT_DATA_TYPE);

    const [hiddenItems, _setHiddenItems] = useState(new Set<string>());

    const [data, setData] = useState<any[]>([]);
    const [sankey, setSankey] = useState<SankeyData>(EMPTY_SANKEY)
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

    function setHiddenItems(hiddenItems: Set<string>) {
        if (hiddenItems.size === 0) {
            setSearchParams("hiddenItems", undefined);
        } else {
            setSearchParams("hiddenItems", [...hiddenItems]);
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
        const sankeyData = calculateSankey(viewType, dataType, accounts, balances[balances.length - 2]);
        setSankey(sankeyData);
    }, [balances, dataType, viewType, hiddenItems]);

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
                        graphType === GraphType.LINE ? <LineChart width={(widthRef.current?.offsetWidth ?? 0) * 0.95} height={vh * 0.7} data={data}>
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
                        </LineChart> : <Sankey width={(widthRef.current?.offsetWidth ?? 0) * 0.95} height={vh * 0.7} data={sankey} node={<SankeyNode />} link={<SankeyLink />}>
                            <Tooltip />
                        </Sankey>
                    }
                </Col>
            </Row>
        </Container>
    )
}