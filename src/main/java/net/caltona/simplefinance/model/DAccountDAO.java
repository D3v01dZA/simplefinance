package net.caltona.simplefinance.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DAccountDAO extends JpaRepository<DAccount, String> {

}
