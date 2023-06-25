package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TotalType {
    IGNORED(CalculationType.IGNORED, FlowGroupingType.IGNORED),
    CASH(CalculationType.ASSET, FlowGroupingType.CASH),
    SHORT_TERM_ASSET(CalculationType.ASSET, FlowGroupingType.GAIN),
    LONG_TERM_ASSET(CalculationType.ASSET, FlowGroupingType.GAIN),
    PHYSICAL_ASSET(CalculationType.ASSET, FlowGroupingType.APPRECIATION),
    RETIREMENT_ASSET(CalculationType.ASSET, FlowGroupingType.GAIN),
    CASH_LIABILITY(CalculationType.LIABILITY, FlowGroupingType.CASH),
    SHORT_TERM_LIABILITY(CalculationType.LIABILITY, FlowGroupingType.INTEREST),
    LONG_TERM_LIABILITY(CalculationType.LIABILITY, FlowGroupingType.INTEREST);

    private final CalculationType calculationType;

    private final FlowGroupingType flowGroupingType;

}
