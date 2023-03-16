package net.caltona.simplefinance;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.caltona.simplefinance.model.Account;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(SpringExtension.class)
@TestPropertySource("classpath:test-application.properties")
class SimpleFinanceApplicationTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() throws Exception {
        // Create an account
        Account account = createAccount("Account");
        List<Account> accounts = listAccounts();
        Assertions.assertEquals(1, accounts.size());
        Assertions.assertEquals(List.of(account), accounts);
    }

    private Account createAccount(String name) throws Exception {
        MockHttpServletResponse response = mvc.perform(post("/api/account/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new Account.NewAccount(name))))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        Account expected = objectMapper.readValue(response.getContentAsByteArray(), Account.class);
        Account fetched = getAccount(expected.getId()).get();
        Assertions.assertEquals(expected, fetched);
        return fetched;
    }

    private List<Account> listAccounts() throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/").contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        return objectMapper.readValue(response.getContentAsByteArray(), new TypeReference<List<Account>>() {});
    }

    private Optional<Account> getAccount(String id) throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/" + id).contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        if (response.getStatus() == 200) {
            return Optional.of(objectMapper.readValue(response.getContentAsByteArray(), Account.class));
        }
        return Optional.empty();
    }

}
