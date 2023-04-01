package net.caltona.simplefinance.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.api.JAccount;
import net.caltona.simplefinance.service.Account;
import net.caltona.simplefinance.service.CheckingAccount;
import net.caltona.simplefinance.service.SavingsAccount;

import java.util.*;
import java.util.stream.Collectors;


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

    public Account account() {
        return type.account(id, name, getDAccountConfigs().stream().collect(Collectors.toMap(DAccountConfig::getId, DAccountConfig::value)));
    }

    public List<DAccountConfig> getDAccountConfigs() {
        return Objects.requireNonNullElse(dAccountConfigs, List.of());
    }

    public void addDAccountConfig(DAccountConfig dAccountConfig) {
        List<DAccountConfig> updated = new ArrayList<>(getDAccountConfigs());
        updated.add(dAccountConfig);
        this.dAccountConfigs = updated;
    }

    public void removeDAccountConfig(DAccountConfig dAccountConfig) {
        List<DAccountConfig> updated = new ArrayList<>(getDAccountConfigs());
        updated.remove(dAccountConfig);
        this.dAccountConfigs = updated;
    }

    public enum Type {
        SAVINGS {
            @Override
            public Account account(String id, String name, Map<String, Object> configByName) {
                return new SavingsAccount(id, name, configByName);
            }
        },
        CHECKING {
            @Override
            public Account account(String id, String name, Map<String, Object> configByName) {
                return new CheckingAccount(id, name, configByName);
            }
        };

        public abstract Account account(String id, String name, Map<String, Object> configByName);

    }

    @Getter
    @ToString
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
    @ToString
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
