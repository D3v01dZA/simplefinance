package net.caltona.simplefinance.api.model;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.service.calculator.FlowGroupingType;
import net.caltona.simplefinance.service.calculator.TotalType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class JBalance {

    @NonNull
    private LocalDate date;

    @NonNull
    private BigDecimal net;

    @NonNull
    private List<TotalBalance> totalBalances;

    @NonNull
    private List<AccountBalance> accountBalances;

    @NonNull
    private List<FlowGrouping> flowGroupings;

    private Difference difference;

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class Difference {

        @NonNull
        private BigDecimal net;

        @NonNull
        private List<TotalBalance> totalBalances;

        @NonNull
        private List<AccountBalance> accountBalances;

        @NonNull
        private List<FlowGrouping> flowGroupings;

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class AccountBalance {

        @NonNull
        private String accountId;

        @NonNull
        private BigDecimal balance;

        @NonNull
        private BigDecimal transfer;

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class TotalBalance {

        @NonNull
        private TotalType type;

        @NonNull
        private BigDecimal balance;

        @NonNull
        private BigDecimal transfer;

        @NonNull
        private BigDecimal flow;

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class FlowGrouping {

        @NonNull
        private FlowGroupingType type;

        @NonNull
        private BigDecimal value;

    }

}
