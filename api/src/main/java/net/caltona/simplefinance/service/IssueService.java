package net.caltona.simplefinance.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ListMultimap;
import com.google.common.collect.Multimaps;
import lombok.AllArgsConstructor;
import net.caltona.simplefinance.db.model.DSetting;
import net.caltona.simplefinance.db.model.DTransaction;
import net.caltona.simplefinance.service.issue.Issue;
import net.caltona.simplefinance.service.issue.TransferWithoutBalance;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@AllArgsConstructor
public class IssueService {

    private SettingService settingService;

    private AccountService accountService;

    public List<Issue> list() {
        Set<String> ignoredAccountIds = settingService.findByKey(DSetting.Key.TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS)
                .map(dSetting -> dSetting.getValue().split(","))
                .map(Set::of)
                .orElse(Set.of());
        return findTransfersWithoutBalances(ignoredAccountIds);
    }

    private List<Issue> findTransfersWithoutBalances(Set<String> ignoredAccountIds) {
        ListMultimap<String, DTransaction> transactionsByDate = accountService.listTransactions().stream()
                .collect(Multimaps.toMultimap(DTransaction::getDate, Function.identity(), ArrayListMultimap::create));
        return Multimaps.asMap(transactionsByDate).values().stream()
                .flatMap(transactionsForSameDate -> findTransactionsWithoutBalances(ignoredAccountIds, transactionsForSameDate))
                .collect(Collectors.toList());
    }

    private Stream<Issue> findTransactionsWithoutBalances(Set<String> ignoredAccountIds, List<DTransaction> transactionsForSameDate) {
        ListMultimap<String, DTransaction> transactionsByAccount = ArrayListMultimap.create();
        transactionsForSameDate.forEach(dTransaction -> {
            transactionsByAccount.put(dTransaction.getDAccount().getId(), dTransaction);
            dTransaction.getDFromAccount().ifPresent(dFromAccount -> transactionsByAccount.put(dFromAccount.getId(), dTransaction));
        });
        return Multimaps.asMap(transactionsByAccount).entrySet().stream()
                .filter(entry -> !ignoredAccountIds.contains(entry.getKey()))
                .flatMap(entry -> {
                    List<DTransaction> transactionsForSameAccountAndDate = entry.getValue();
                    List<DTransaction> transfers = transactionsForSameAccountAndDate.stream()
                            .filter(dTransaction -> dTransaction.getType() == DTransaction.Type.TRANSFER)
                            .toList();
                    if (!transfers.isEmpty()) {
                        boolean hasBalance = transactionsForSameAccountAndDate.stream()
                                .anyMatch(dTransaction -> dTransaction.getType() == DTransaction.Type.BALANCE);
                        if (!hasBalance) {
                            return transfers.stream()
                                    .map(dTransaction -> {
                                        if (dTransaction.getDAccount().getId().equals(entry.getKey())) {
                                            return new TransferWithoutBalance(entry.getKey(), dTransaction.getId(), dTransaction.getDate());
                                        }
                                        return new TransferWithoutBalance(dTransaction.getDFromAccount().get().getId(), dTransaction.getId(), dTransaction.getDate());
                                    });
                        }
                    }
                    return Stream.of();
                });
    }

}
