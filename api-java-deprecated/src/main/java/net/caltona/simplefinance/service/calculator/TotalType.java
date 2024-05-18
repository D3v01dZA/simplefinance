package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TotalType {
    EXTERNAL(CalculationType.NOT_IGNORED, FlowGroupingType.EXTERNAL),
    CASH(CalculationType.NOT_IGNORED, FlowGroupingType.CASH),
    SHORT_TERM_ASSET(CalculationType.NOT_IGNORED, FlowGroupingType.GAIN),
    LONG_TERM_ASSET(CalculationType.NOT_IGNORED, FlowGroupingType.GAIN),
    PHYSICAL_ASSET(CalculationType.NOT_IGNORED, FlowGroupingType.APPRECIATION),
    RETIREMENT_ASSET(CalculationType.NOT_IGNORED, FlowGroupingType.RETIREMENT),
    CASH_LIABILITY(CalculationType.NOT_IGNORED, FlowGroupingType.CASH),
    SHORT_TERM_LIABILITY(CalculationType.NOT_IGNORED, FlowGroupingType.INTEREST),
    LONG_TERM_LIABILITY(CalculationType.NOT_IGNORED, FlowGroupingType.INTEREST);

    private final CalculationType calculationType;

    private final FlowGroupingType flowGroupingType;

}
