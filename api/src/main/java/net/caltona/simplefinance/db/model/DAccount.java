package net.caltona.simplefinance.db.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.api.model.JAccount;
import net.caltona.simplefinance.service.*;
import net.caltona.simplefinance.service.transaction.Transaction;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor

@Entity(name = "account")
public class DAccount {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column
    private String name;

    @Column
    private Type type;

    @OneToMany(mappedBy = "dAccount")
    private List<DAccountConfig> dAccountConfigs;

    @OneToMany(mappedBy = "dAccount")
    private List<DTransaction> dTransactions;

    @OneToMany(mappedBy = "dToAccount")
    private List<DTransaction> dToTransactions;

    public DAccount(String name, Type type) {
        this.name = name;
        this.type = type;
    }

    public JAccount json() {
        return new JAccount(id, name, type);
    }

    public Optional<DAccountConfig> dAccountConfig(String id) {
        return getDAccountConfigs().stream()
                .filter(dAccountConfig -> dAccountConfig.getId().equals(id))
                .findFirst();
    }

    public Optional<DTransaction> dTransaction(String id) {
        return getDTransactions().stream()
                .filter(dTransaction -> dTransaction.getId().equals(id))
                .findFirst();
    }

    public Account account() {
        Supplier<Map<String, Object>> configByNameSupplier = () -> getDAccountConfigs().stream()
                .collect(Collectors.toMap(DAccountConfig::getName, DAccountConfig::value));
        Supplier<List<Transaction>> transactionsSupplier = () -> Stream.concat(getDTransactions().stream(), getDToTransactions().stream())
                .sorted(Comparator.comparing(DTransaction::getDate))
                .map(dTransaction -> dTransaction.transaction(id))
                .collect(Collectors.toList());
        return type.account(id, name, configByNameSupplier, transactionsSupplier);
    }

    public List<DAccountConfig> getDAccountConfigs() {
        return Objects.requireNonNullElse(dAccountConfigs, List.of());
    }

    public List<DTransaction> getDTransactions() {
        return Objects.requireNonNullElse(dTransactions, List.of());
    }

    public List<DTransaction> getDToTransactions() {
        return Objects.requireNonNullElse(dToTransactions, List.of());
    }

    public void addDAccountConfig(DAccountConfig dAccountConfig) {
        List<DAccountConfig> updated = new ArrayList<>(getDAccountConfigs());
        updated.add(dAccountConfig);
        this.dAccountConfigs = updated;
    }

    public void addDTransaction(DTransaction dTransaction) {
        List<DTransaction> updated = new ArrayList<>(getDTransactions());
        updated.add(dTransaction);
        this.dTransactions = updated;
    }

    public void removeDAccountConfig(DAccountConfig dAccountConfig) {
        List<DAccountConfig> updated = new ArrayList<>(getDAccountConfigs());
        updated.remove(dAccountConfig);
        this.dAccountConfigs = updated;
    }

    public void removeDTransaction(DTransaction dTransaction) {
        List<DTransaction> updated = new ArrayList<>(getDTransactions());
        updated.remove(dTransaction);
        this.dTransactions = updated;
    }

    public enum Type {
        SAVINGS {
            @Override
            public Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
                return new SavingsAccount(id, name, configByNameSupplier, transactionsSupplier);
            }
        },
        CHECKING {
            @Override
            public Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
                return new CheckingAccount(id, name, configByNameSupplier, transactionsSupplier);
            }
        },
        LOAN {
            @Override
            public Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
                return new LoanAccount(id, name, configByNameSupplier, transactionsSupplier);
            }
        },
        INVESTMENT {
            @Override
            public Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
                return new InvestmentAccount(id, name, configByNameSupplier, transactionsSupplier);
            }
        },
        RETIREMENT {
            @Override
            public Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
                return new RetirementAccount(id, name, configByNameSupplier, transactionsSupplier);
            }
        },
        ASSET {
            @Override
            public Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
                return new AssetAccount(id, name, configByNameSupplier, transactionsSupplier);
            }
        },
        EXTERNAL {
            @Override
            public Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier) {
                return new PlaceholderAccount(id, name, configByNameSupplier, transactionsSupplier);
            }
        };

        public abstract Account account(String id, String name, Supplier<Map<String, Object>> configByNameSupplier, Supplier<List<Transaction>> transactionsSupplier);

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewAccount {

        @NonNull
        private final String name;

        @NonNull
        private final DAccount.Type type;

        public DAccount dAccount() {
            return new DAccount(name, type);
        }

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateAccount {

        @NonNull
        private final String id;

        private final String name;

        public Optional<String> getName() {
            return Optional.ofNullable(name);
        }

    }
}
