package net.caltona.simplefinance.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.service.Account;
import net.caltona.simplefinance.service.CheckingAccount;
import net.caltona.simplefinance.service.SavingsAccount;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;


@Getter
@Setter
@ToString
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
    @Cascade(CascadeType.ALL)
    private List<DAccountConfig> dAccountConfigs;

    public DAccount(String name, Type type) {
        this.name = name;
        this.type = type;
    }

    public Account account() {
        return type.account(id, name, getDAccountConfigs().stream().collect(Collectors.toMap(DAccountConfig::getId, DAccountConfig::value)));
    }

    public List<DAccountConfig> getDAccountConfigs() {
        return Objects.requireNonNullElse(dAccountConfigs, List.of());
    }

    public enum Type {
        SAVINGS {
            @Override
            public Account account(String id, String name, Map<String, Object> configByName) {
                return new SavingsAccount(id, name);
            }
        },
        CHECKING {
            @Override
            public Account account(String id, String name, Map<String, Object> configByName) {
                return new CheckingAccount(id, name);
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

    }
}
