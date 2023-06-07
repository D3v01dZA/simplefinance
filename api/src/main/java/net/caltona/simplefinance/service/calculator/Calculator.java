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
public class Calculator {

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
        Totals totals = new Totals();
        List<JBalance.AccountBalance> accountBalances = new ArrayList<>();

        for (Account account : accounts) {
            BigDecimal balance = account.calculateBalance(date);
            BigDecimal transfer = account.calculateTransfer(date);
            JBalance.AccountBalance accountBalance = new JBalance.AccountBalance(account.getId(), balance, transfer);
            accountBalances.add(accountBalance);
            totals = account.totalType().addTotal(totals, balance);
            totals = account.totalType().addTransfer(totals, transfer);
            totals = totals.withAccountBalance(account.getId(), accountBalance);
        }

        return new JBalance(
                date,
                totals.getCashBalance(),
                totals.getCashTransfer(),
                totals.getLiquidAssetsBalance(),
                totals.getLiquidAssetTransfer(),
                totals.getIlliquidAssetsBalance(),
                totals.getIlliquidAssetTransfer(),
                totals.getRetirementBalance(),
                totals.getRetirementTransfer(),
                totals.getLiabilitiesBalance(),
                totals.getLiabilitiesTransfer(),
                totals.getNet(),
                accountBalances,
                previous != null && previous.getNet().compareTo(BigDecimal.ZERO) != 0 ? totals.difference(previous) : null
        );
    }

    public enum TotalType {
        IGNORED {
            @Override
            public Totals addTotal(Totals totals, BigDecimal amount) {
                return totals;
            }

            @Override
            public Totals addTransfer(Totals totals, BigDecimal amount) {
                return totals;
            }
        },
        CASH {
            @Override
            public Totals addTotal(Totals totals, BigDecimal amount) {
                totals = totals.withCashBalance(totals.getCashBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }

            @Override
            public Totals addTransfer(Totals totals, BigDecimal amount) {
                totals = totals.withCashTransfer(totals.getCashTransfer().add(amount));
                return totals;
            }
        },
        LIQUID_ASSET {
            @Override
            public Totals addTotal(Totals totals, BigDecimal amount) {
                totals = totals.withLiquidAssetsBalance(totals.getLiquidAssetsBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }

            @Override
            public Totals addTransfer(Totals totals, BigDecimal amount) {
                totals = totals.withLiquidAssetTransfer(totals.getLiquidAssetTransfer().add(amount));
                return totals;
            }
        },
        ILLIQUID_ASSET {
            @Override
            public Totals addTotal(Totals totals, BigDecimal amount) {
                totals = totals.withIlliquidAssetsBalance(totals.getIlliquidAssetsBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }

            @Override
            public Totals addTransfer(Totals totals, BigDecimal amount) {
                totals = totals.withIlliquidAssetTransfer(totals.getIlliquidAssetTransfer().add(amount));
                return totals;
            }
        },
        RETIREMENT {
            @Override
            public Totals addTotal(Totals totals, BigDecimal amount) {
                totals = totals.withRetirementBalance(totals.getRetirementBalance().add(amount));
                totals = totals.withNet(totals.getNet().add(amount));
                return totals;
            }

            @Override
            public Totals addTransfer(Totals totals, BigDecimal amount) {
                totals = totals.withRetirementTransfer(totals.getRetirementTransfer().add(amount));
                return totals;
            }
        },
        LIABILITY {
            @Override
            public Totals addTotal(Totals totals, BigDecimal amount) {
                totals = totals.withLiabilitiesBalance(totals.getLiabilitiesBalance().add(amount));
                totals = totals.withNet(totals.getNet().subtract(amount));
                return totals;
            }

            @Override
            public Totals addTransfer(Totals totals, BigDecimal amount) {
                totals = totals.withLiabilitiesTransfer(totals.getLiabilitiesTransfer().add(amount));
                return totals;
            }
        };

        public abstract Totals addTotal(Totals totals, BigDecimal amount);

        public abstract Totals addTransfer(Totals totals, BigDecimal amount);
    }

    @With
    @Getter
    @AllArgsConstructor
    public static class Totals {

        private BigDecimal cashBalance;
        private BigDecimal cashTransfer;
        private BigDecimal liquidAssetsBalance;
        private BigDecimal liquidAssetTransfer;
        private BigDecimal illiquidAssetsBalance;
        private BigDecimal illiquidAssetTransfer;
        private BigDecimal retirementBalance;
        private BigDecimal retirementTransfer;
        private BigDecimal liabilitiesBalance;
        private BigDecimal liabilitiesTransfer;
        private BigDecimal net;
        private LinkedHashMap<String, JBalance.AccountBalance> accountBalances;

        public Totals() {
            this(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, new LinkedHashMap<>()
            );
        }

        public JBalance.Difference difference(JBalance previous) {
            return new JBalance.Difference(
                    cashBalance.subtract(previous.getCashBalance()),
                    cashTransfer.subtract(previous.getCashTransfer()),
                    liquidAssetsBalance.subtract(previous.getLiquidAssetsBalance()),
                    liquidAssetTransfer.subtract(previous.getLiquidAssetTransfer()),
                    illiquidAssetsBalance.subtract(previous.getIlliquidAssetsBalance()),
                    illiquidAssetTransfer.subtract(previous.getIlliquidAssetTransfer()),
                    retirementBalance.subtract(previous.getRetirementBalance()),
                    retirementTransfer.subtract(previous.getRetirementTransfer()),
                    liabilitiesBalance.subtract(previous.getLiabilitiesBalance()),
                    liabilitiesTransfer.subtract(previous.getLiabilitiesTransfer()),
                    net.subtract(previous.getNet()),
                    calculateDifference(previous.getAccountBalances())
            );
        }

        private Totals withAccountBalance(String accountId, JBalance.AccountBalance accountBalance) {
            LinkedHashMap<String, JBalance.AccountBalance> accountBalances = new LinkedHashMap<>(this.accountBalances);
            Assert.isTrue(!accountBalances.containsKey(accountId), "Account id is duplicated");
            accountBalances.put(accountId, accountBalance);
            return new Totals(
                    cashBalance,
                    cashTransfer,
                    liquidAssetsBalance,
                    liquidAssetTransfer,
                    illiquidAssetsBalance,
                    illiquidAssetTransfer,
                    retirementBalance,
                    retirementTransfer,
                    liabilitiesBalance,
                    liabilitiesTransfer,
                    net,
                    accountBalances
            );
        }

        private List<JBalance.AccountBalance> calculateDifference(List<JBalance.AccountBalance> previousBalances) {
            List<JBalance.AccountBalance> result = new ArrayList<>();
            Set<String> usedIds = new HashSet<>();

            for (JBalance.AccountBalance previousBalance : previousBalances) {
                String id = previousBalance.getAccountId();
                usedIds.add(id);
                JBalance.AccountBalance newer = accountBalances.get(id);
                if (newer != null) {
                    JBalance.AccountBalance difference = new JBalance.AccountBalance(
                            id,
                            newer.getBalance().subtract(previousBalance.getBalance()),
                            newer.getTransfer().subtract(previousBalance.getTransfer())
                    );
                    result.add(difference);
                } else {
                    JBalance.AccountBalance difference = new JBalance.AccountBalance(
                            id,
                            previousBalance.getBalance().negate(),
                            previousBalance.getTransfer().negate()
                    );
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
