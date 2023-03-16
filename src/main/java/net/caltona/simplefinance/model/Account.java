package net.caltona.simplefinance.model;

import jakarta.persistence.*;
import lombok.*;


@Getter
@Setter
@Entity
@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class Account {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column
    private String name;

    public Account(NewAccount newAccount) {
        this.name = newAccount.getName();
    }

    @Getter
    @ToString
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewAccount {

        private final String name;

    }
}
