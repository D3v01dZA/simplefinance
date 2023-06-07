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

        for (Account account : accounts) {
            BigDecimal balance = account.calculateBalance(date);
            BigDecimal transfer = account.calculateTransfer(date);
            JBalance.AccountBalance accountBalance = new JBalance.AccountBalance(account.getId(), balance, transfer);
            totals = account.totalType().addTotal(totals, balance);
            totals = account.totalType().addTransfer(totals, transfer);
            totals = totals.withAccountBalance(account.getId(), accountBalance);
        }

        return new JBalance(
                date,
                totals.getNet(),
                List.copyOf(totals.getTotalBalances().values()),
                List.copyOf(totals.getAccountBalances().values()),
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

            @Override
            public Totals addNet(Totals totals, BigDecimal amount) {
                return totals;
            }
        },
        CASH {
            @Override
            public Totals addNet(Totals totals, BigDecimal amount) {
                return totals.withNet(totals.getNet().add(amount));
            }
        },
        LIQUID_ASSET {
            @Override
            public Totals addNet(Totals totals, BigDecimal amount) {
                return totals.withNet(totals.getNet().add(amount));
            }
        },
        ILLIQUID_ASSET {
            @Override
            public Totals addNet(Totals totals, BigDecimal amount) {
                return totals.withNet(totals.getNet().add(amount));
            }
        },
        RETIREMENT {
            @Override
            public Totals addNet(Totals totals, BigDecimal amount) {
                return totals.withNet(totals.getNet().add(amount));
            }
        },
        LIABILITY {
            @Override
            public Totals addNet(Totals totals, BigDecimal amount) {
                return totals.withNet(totals.getNet().subtract(amount));
            }
        };

        public Totals addTotal(Totals totals, BigDecimal amount) {
            JBalance.TotalBalance current = totals.getTotalBalances().get(this);
            totals = totals.withTotalBalance(this, new JBalance.TotalBalance(this, current.getBalance().add(amount), current.getTransfer()));
            return addNet(totals, amount);
        }

        public Totals addTransfer(Totals totals, BigDecimal amount) {
            JBalance.TotalBalance current = totals.getTotalBalances().get(this);
            totals = totals.withTotalBalance(this, new JBalance.TotalBalance(this, current.getBalance(), current.getTransfer().add(amount)));
            return totals;
        }

        protected abstract Totals addNet(Totals totals, BigDecimal amount);
    }

    @With
    @Getter
    @AllArgsConstructor
    public static class Totals {

        private BigDecimal net;
        private LinkedHashMap<TotalType, JBalance.TotalBalance> totalBalances;
        private LinkedHashMap<String, JBalance.AccountBalance> accountBalances;

        public Totals() {
            this(BigDecimal.ZERO, new LinkedHashMap<>(), new LinkedHashMap<>());
            for (TotalType value : TotalType.values()) {
                totalBalances.put(value, new JBalance.TotalBalance(value, BigDecimal.ZERO, BigDecimal.ZERO));
            }
        }

        public JBalance.Difference difference(JBalance previous) {
            return new JBalance.Difference(
                    net.subtract(previous.getNet()),
                    calculateTotalDifference(previous.getTotalBalances()),
                    calculateAccountDifference(previous.getAccountBalances())
            );
        }

        private Totals withTotalBalance(TotalType type, JBalance.TotalBalance totalBalance) {
            LinkedHashMap<TotalType, JBalance.TotalBalance> totalBalances = new LinkedHashMap<>(this.totalBalances);
            totalBalances.put(type, totalBalance);
            return new Totals(
                    net,
                    totalBalances,
                    accountBalances
            );
        }

        private Totals withAccountBalance(String accountId, JBalance.AccountBalance accountBalance) {
            LinkedHashMap<String, JBalance.AccountBalance> accountBalances = new LinkedHashMap<>(this.accountBalances);
            Assert.isTrue(!accountBalances.containsKey(accountId), "Account id is duplicated");
            accountBalances.put(accountId, accountBalance);
            return new Totals(
                    net,
                    totalBalances,
                    accountBalances
            );
        }

        private List<JBalance.TotalBalance> calculateTotalDifference(List<JBalance.TotalBalance> previousBalances) {
            List<JBalance.TotalBalance> result = new ArrayList<>();
            Set<TotalType> seenTypes = new HashSet<>();

            for (JBalance.TotalBalance previousBalance : previousBalances) {
                TotalType type = previousBalance.getType();
                seenTypes.add(type);
                JBalance.TotalBalance newer = totalBalances.get(type);
                Assert.notNull(newer, "Missing total");
                JBalance.TotalBalance difference = new JBalance.TotalBalance(
                        type,
                        newer.getBalance().subtract(previousBalance.getBalance()),
                        newer.getTransfer().subtract(previousBalance.getTransfer())
                );
                result.add(difference);
            }

            Set<TotalType> remainingIds = new HashSet<>(totalBalances.keySet());
            remainingIds.removeAll(seenTypes);
            Assert.isTrue(remainingIds.isEmpty(), "Totals difference error");
            return result;
        }

        private List<JBalance.AccountBalance> calculateAccountDifference(List<JBalance.AccountBalance> previousBalances) {
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
