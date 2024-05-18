package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
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
            TotalType totalType = account.totalType();
            totalType.getCalculationType().addNet(totals, balance);
            totalType.getCalculationType().addTotal(totalType, totals, balance);
            totalType.getCalculationType().addTransfer(totalType, totals, transfer);
            totals.getAccountBalances().put(account.getId(), accountBalance);
        }

        for (TotalType totalType : TotalType.values()) {
            CalculationType calculationType = totalType.getCalculationType();
            BigDecimal flow = calculationType.calculateFlow(totalType, totals);
            calculationType.addFlow(totalType, totals, flow);
            totalType.getFlowGroupingType().addFlowGrouping(totals, flow);
        }

        return new JBalance(
                date,
                totals.getNet(),
                List.copyOf(totals.getTotalBalances().values()),
                List.copyOf(totals.getAccountBalances().values()),
                List.copyOf(totals.getFlowGroupings().values()),
                previous != null && previous.getNet().compareTo(BigDecimal.ZERO) != 0 ? calculateDifference(totals, previous) : null
        );
    }

    private JBalance.Difference calculateDifference(Totals totals, JBalance previous) {
        return new JBalance.Difference(
                totals.getNet().subtract(previous.getNet()),
                calculateTotalDifference(totals, previous.getTotalBalances()),
                calculateAccountDifference(totals, previous.getAccountBalances()),
                calculateFlowGroupingDifference(totals, previous.getFlowGroupings())
        );
    }

    private List<JBalance.TotalBalance> calculateTotalDifference(Totals totals, List<JBalance.TotalBalance> previousBalances) {
        List<JBalance.TotalBalance> result = new ArrayList<>();
        Set<TotalType> seenTypes = new HashSet<>();

        for (JBalance.TotalBalance previousBalance : previousBalances) {
            TotalType type = previousBalance.getType();
            seenTypes.add(type);
            JBalance.TotalBalance newer = totals.getTotalBalances().get(type);
            Assert.notNull(newer, "Missing total");
            JBalance.TotalBalance difference = new JBalance.TotalBalance(
                    type,
                    newer.getBalance().subtract(previousBalance.getBalance()),
                    newer.getTransfer().subtract(previousBalance.getTransfer()),
                    newer.getFlow().subtract(previousBalance.getFlow())
            );
            result.add(difference);
        }

        Set<TotalType> remainingIds = new HashSet<>(totals.getTotalBalances().keySet());
        remainingIds.removeAll(seenTypes);
        Assert.isTrue(remainingIds.isEmpty(), "Totals difference error");
        return result;
    }

    private List<JBalance.FlowGrouping> calculateFlowGroupingDifference(Totals totals, List<JBalance.FlowGrouping> previousFlowGroupings) {
        List<JBalance.FlowGrouping> result = new ArrayList<>();
        Set<FlowGroupingType> seenTypes = new HashSet<>();

        for (JBalance.FlowGrouping previousFlowGrouping : previousFlowGroupings) {
            FlowGroupingType type = previousFlowGrouping.getType();
            seenTypes.add(type);
            JBalance.FlowGrouping newer = totals.getFlowGroupings().get(type);
            Assert.notNull(newer, "Missing flow grouping");
            JBalance.FlowGrouping difference = new JBalance.FlowGrouping(
                    type,
                    newer.getValue().subtract(previousFlowGrouping.getValue())
            );
            result.add(difference);
        }

        Set<FlowGroupingType> remainingIds = new HashSet<>(totals.getFlowGroupings().keySet());
        remainingIds.removeAll(seenTypes);
        Assert.isTrue(remainingIds.isEmpty(), "Flow grouping difference error");
        return result;
    }

    private List<JBalance.AccountBalance> calculateAccountDifference(Totals totals, List<JBalance.AccountBalance> previousBalances) {
        List<JBalance.AccountBalance> result = new ArrayList<>();
        Set<String> usedIds = new HashSet<>();

        for (JBalance.AccountBalance previousBalance : previousBalances) {
            String id = previousBalance.getAccountId();
            usedIds.add(id);
            JBalance.AccountBalance newer = totals.getAccountBalances().get(id);
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

        Set<String> remainingIds = new HashSet<>(totals.getAccountBalances().keySet());
        remainingIds.removeAll(usedIds);
        for (String remainingId : remainingIds) {
            result.add(totals.getAccountBalances().get(remainingId));
        }
        return result;
    }


}
