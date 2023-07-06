import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ButtonGroup, Col, Form, Row } from "react-bootstrap";
import { faBackwardFast, faBackward, faForward, faForwardFast } from '@fortawesome/free-solid-svg-icons';
import { maxPage } from "../util/util";

export const DEFAULT_PAGE_SIZE = 20;

export function Pagination({ itemCount, page, setPage, pageSize, setPageSize }: { itemCount: number, page: number, setPage: (page: number) => void, pageSize: number, setPageSize: (pageSize: number) => void }) {
    return (
        <Row xs={1} xl={2}>
            <Col></Col>
            <Col>
                <Row xs={1} xl={2}>
                    <Col>
                        <Form.Select value={pageSize} onChange={e => setPageSize(parseInt(e.target.value))}>
                            <option value={0}>All</option>
                            <option value={10}>10 Per Page</option>
                            <option value={20}>20 Per Page</option>
                            <option value={50}>50 Per Page</option>
                            <option value={100}>100 Per Page</option>
                        </Form.Select>
                    </Col>
                    <Col>
                        <ButtonGroup>
                            <Button variant="primary" onClick={() => setPage(page - 10)}>
                                <FontAwesomeIcon icon={faBackwardFast} />
                            </Button>
                            <Button variant="primary" onClick={() => setPage(page - 1)}>
                                <FontAwesomeIcon icon={faBackward} />
                            </Button>
                            <Button variant="primary">
                                Page {page + 1}/{maxPage(itemCount, pageSize) + 1}
                            </Button>
                            <Button variant="primary" onClick={() => setPage(page + 1)}>
                                <FontAwesomeIcon icon={faForward} />
                            </Button>
                            <Button variant="primary" onClick={() => setPage(page + 10)}>
                                <FontAwesomeIcon icon={faForwardFast} />
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}