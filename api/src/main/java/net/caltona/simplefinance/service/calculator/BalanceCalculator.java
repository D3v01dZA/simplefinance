package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.With;
import net.caltona.simplefinance.api.model.JBalance;
import net.caltona.simplefinance.service.Account;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class BalanceCalculator {

    private List<Account> accounts;

    public List<JBalance> calculate(List<LocalDate> dates) {
        List<JBalance> balances = new ArrayList<>();
        JBalance balance = null;
        for (LocalDate date : dates) {
            balance = calculate(balance, date);
            if (balance.getNet().compareTo(BigDecimal.ZERO) != 0) {
                balances.add(balance);
            }
        }
        return balances;
    }

    public JBalance calculate(LocalDate date) {
        return calculate(null, date);
    }

    private JBalance calculate(JBalance previous, LocalDate date) {
        Totals totals = new Totals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        List<JBalance.AccountBalance> accountBalances = new ArrayList<>();

        for (Account account : accounts) {
            BigDecimal balance = account.calculateBalance(date);
            accountBalances.add(new JBalance.AccountBalance(account.getId(), account.getName(), balance));
            totals = account.totalType().add(totals, balance);
        }

        return new JBalance(
                date,
                totals.getCashBalance(),
                totals.getLiquidAssetsBalance(),
                totals.getIlliquidAssetsBalance(),
                totals.getRetirementBalance(),
                totals.getLiabilitiesBalance(),
                totals.getNet(),
                accountBalances,
                previous != null && previous.getNet().compareTo(BigDecimal.ZERO) != 0 ? totals.difference(previous) : null
        );
    }

    public enum TotalType {
        IGNORED {
            @Override
            public Totals add(Totals totals, BigDecimal amount) {
                return totals;
            }
        },
        CASH {
            @Override
            public Totals add(Totals totals, BigDecimal amount) {
                totals = totals.withCashBalance(totals.getCashBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }
        },
        LIQUID_ASSET {
            @Override
            public Totals add(Totals totals, BigDecimal amount) {
                totals = totals.withLiquidAssetsBalance(totals.getLiquidAssetsBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }
        },
        ILLIQUID_ASSET {
            @Override
            public Totals add(Totals totals, BigDecimal amount) {
                totals = totals.withIlliquidAssetsBalance(totals.getIlliquidAssetsBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }
        },
        RETIREMENT {
            @Override
            public Totals add(Totals totals, BigDecimal amount) {
                totals = totals.withRetirementBalance(totals.getRetirementBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }
        },
        LIABILITY {
            @Override
            public Totals add(Totals totals, BigDecimal amount) {
                totals = totals.withLiabilitiesBalance(totals.getLiabilitiesBalance().add(amount));
                totals = totals.withNet(totals.getNet().subtract(amount));
                return totals;
            }
        };

        public abstract Totals add(Totals totals, BigDecimal amount);
    }

    @With
    @Getter
    @AllArgsConstructor
    public static class Totals {

        private BigDecimal cashBalance;
        private BigDecimal liquidAssetsBalance;
        private BigDecimal illiquidAssetsBalance;
        private BigDecimal retirementBalance;
        private BigDecimal liabilitiesBalance;
        private BigDecimal net;

        public JBalance.Difference difference(JBalance previous) {
            return new JBalance.Difference(
                    cashBalance.subtract(previous.getCashBalance()),
                    liquidAssetsBalance.subtract(previous.getLiquidAssetsBalance()),
                    illiquidAssetsBalance.subtract(previous.getIlliquidAssetsBalance()),
                    retirementBalance.subtract(previous.getRetirementBalance()),
                    liabilitiesBalance.subtract(previous.getLiabilitiesBalance()),
                    net.subtract(previous.getNet()),
                    new ArrayList<>()
            );
        }

    }

}
