package net.caltona.simplefinance.api.model;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Getter
@EqualsAndHashCode
public class JBalance {

    private LocalDate localDate;

    private BigDecimal cashBalance;

    private BigDecimal liquidAssetsBalance;

    private BigDecimal illiquidAssetsBalance;

    private BigDecimal retirementBalance;

    private BigDecimal liabilitiesBalance;

    private BigDecimal net;

    private Difference difference;

    private List<AccountBalance> accountBalances;

    @java.beans.ConstructorProperties({"localDate", "cashBalance", "liquidAssetsBalance", "illiquidAssetsBalance", "retirementBalance", "liabilitiesBalance", "net", "accountBalances", "difference"})
    public JBalance(LocalDate localDate, @NonNull BigDecimal cashBalance, @NonNull BigDecimal liquidAssetsBalance, @NonNull BigDecimal illiquidAssetsBalance, @NonNull BigDecimal retirementBalance, @NonNull BigDecimal liabilitiesBalance, @NonNull BigDecimal net, @NonNull List<AccountBalance> accountBalances, Difference difference) {
        this.localDate = localDate;
        this.cashBalance = cashBalance.setScale(2, RoundingMode.FLOOR);
        this.liquidAssetsBalance = liquidAssetsBalance.setScale(2, RoundingMode.FLOOR);
        this.illiquidAssetsBalance = illiquidAssetsBalance.setScale(2, RoundingMode.FLOOR);
        this.retirementBalance = retirementBalance.setScale(2, RoundingMode.FLOOR);
        this.liabilitiesBalance = liabilitiesBalance.setScale(2, RoundingMode.FLOOR);
        this.net = net.setScale(2, RoundingMode.FLOOR);
        this.accountBalances = accountBalances;
        this.difference = difference;
    }

    @Getter
    @EqualsAndHashCode
    public static class Difference {

        private BigDecimal cashBalance;

        private BigDecimal liquidAssetsBalance;

        private BigDecimal illiquidAssetsBalance;

        private BigDecimal retirementBalance;

        private BigDecimal liabilitiesBalance;

        private BigDecimal net;

        private List<AccountBalance> accountBalances;

        @java.beans.ConstructorProperties({"cashBalance", "liquidAssetsBalance", "illiquidAssetsBalance", "retirementBalance", "liabilitiesBalance", "net", "accountBalances"})
        public Difference(@NonNull BigDecimal cashBalance, @NonNull BigDecimal liquidAssetsBalance, @NonNull BigDecimal illiquidAssetsBalance, @NonNull BigDecimal retirementBalance, @NonNull BigDecimal liabilitiesBalance, @NonNull BigDecimal net, @NonNull List<AccountBalance> accountBalances) {
            this.cashBalance = cashBalance.setScale(2, RoundingMode.FLOOR);
            this.liquidAssetsBalance = liquidAssetsBalance.setScale(2, RoundingMode.FLOOR);
            this.illiquidAssetsBalance = illiquidAssetsBalance.setScale(2, RoundingMode.FLOOR);
            this.retirementBalance = retirementBalance.setScale(2, RoundingMode.FLOOR);
            this.liabilitiesBalance = liabilitiesBalance.setScale(2, RoundingMode.FLOOR);
            this.net = net.setScale(2, RoundingMode.FLOOR);
            this.accountBalances = accountBalances;
        }
    }

    @Getter
    @EqualsAndHashCode
    public static class AccountBalance {

        @NonNull
        private String id;

        @NonNull
        private String name;

        @NonNull
        private BigDecimal balance;

        @java.beans.ConstructorProperties({"id", "name", "balance"})
        public AccountBalance(@NonNull String id, @NonNull String name, @NonNull BigDecimal balance) {
            this.id = id;
            this.name = name;
            this.balance = balance.setScale(2, RoundingMode.FLOOR);
        }
    }

}
