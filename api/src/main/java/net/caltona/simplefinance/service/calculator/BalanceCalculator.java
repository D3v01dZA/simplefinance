package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.With;
import net.caltona.simplefinance.api.model.JBalance;
import net.caltona.simplefinance.service.Account;
import org.springframework.util.Assert;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

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
        Totals totals = new Totals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, new LinkedHashMap<>());
        List<JBalance.AccountBalance> accountBalances = new ArrayList<>();

        for (Account account : accounts) {
            BigDecimal balance = account.calculateBalance(date);
            JBalance.AccountBalance accountBalance = new JBalance.AccountBalance(account.getId(), balance);
            accountBalances.add(accountBalance);
            totals = account.totalType().add(totals, balance);
            totals = totals.withAccountBalance(account.getId(), accountBalance);
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
        private LinkedHashMap<String, JBalance.AccountBalance> accountBalances;

        public JBalance.Difference difference(JBalance previous) {
            return new JBalance.Difference(
                    cashBalance.subtract(previous.getCashBalance()),
                    liquidAssetsBalance.subtract(previous.getLiquidAssetsBalance()),
                    illiquidAssetsBalance.subtract(previous.getIlliquidAssetsBalance()),
                    retirementBalance.subtract(previous.getRetirementBalance()),
                    liabilitiesBalance.subtract(previous.getLiabilitiesBalance()),
                    net.subtract(previous.getNet()),
                    calculateDifference(previous.getAccountBalances())
            );
        }

        private Totals withAccountBalance(String accountId, JBalance.AccountBalance accountBalance) {
            LinkedHashMap<String, JBalance.AccountBalance> accountBalances = new LinkedHashMap<>(this.accountBalances);
            Assert.isTrue(!accountBalances.containsKey(accountId), "Account id is duplicated");
            accountBalances.put(accountId, accountBalance);
            return new Totals(cashBalance, liquidAssetsBalance, illiquidAssetsBalance, retirementBalance, liabilitiesBalance, net, accountBalances);
        }

        private List<JBalance.AccountBalance> calculateDifference(List<JBalance.AccountBalance> previousBalances) {
            List<JBalance.AccountBalance> result = new ArrayList<>();
            Set<String> usedIds = new HashSet<>();

            for (JBalance.AccountBalance previousBalance : previousBalances) {
                String id = previousBalance.getId();
                usedIds.add(id);
                JBalance.AccountBalance newer = accountBalances.get(id);
                if (newer != null) {
                    JBalance.AccountBalance difference = new JBalance.AccountBalance(id, newer.getBalance().subtract(previousBalance.getBalance()));
                    result.add(difference);
                } else {
                    JBalance.AccountBalance difference = new JBalance.AccountBalance(id, previousBalance.getBalance().negate());
                    result.add(difference);
                }
            }

            Set<String> remainingIds = new HashSet<>(accountBalances.keySet());
            remainingIds.removeAll(usedIds);
            for (String remainingId : remainingIds) {
                result.add(accountBalances.get(remainingId));
            }
            return result;
        }

    }

}
