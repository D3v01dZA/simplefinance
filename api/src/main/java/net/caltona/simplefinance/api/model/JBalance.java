package net.caltona.simplefinance.api.model;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;

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
    private BigDecimal cashBalance;

    @NonNull
    private BigDecimal cashTransfer;

    @NonNull
    private BigDecimal liquidAssetsBalance;

    @NonNull
    private BigDecimal liquidAssetTransfer;

    @NonNull
    private BigDecimal illiquidAssetsBalance;

    @NonNull
    private BigDecimal illiquidAssetTransfer;

    @NonNull
    private BigDecimal retirementBalance;

    @NonNull
    private BigDecimal retirementTransfer;

    @NonNull
    private BigDecimal liabilitiesBalance;

    @NonNull
    private BigDecimal liabilitiesTransfer;

    @NonNull
    private BigDecimal net;

    @NonNull
    private List<AccountBalance> accountBalances;

    private Difference difference;

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class Difference {

        @NonNull
        private BigDecimal cashBalance;

        @NonNull
        private BigDecimal cashTransfer;

        @NonNull
        private BigDecimal liquidAssetsBalance;

        @NonNull
        private BigDecimal liquidAssetTransfer;

        @NonNull
        private BigDecimal illiquidAssetsBalance;

        @NonNull
        private BigDecimal illiquidAssetTransfer;

        @NonNull
        private BigDecimal retirementBalance;

        @NonNull
        private BigDecimal retirementTransfer;

        @NonNull
        private BigDecimal liabilitiesBalance;

        @NonNull
        private BigDecimal liabilitiesTransfer;

        @NonNull
        private BigDecimal net;

        @NonNull
        private List<AccountBalance> accountBalances;

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

}
