package com.custcoding.estaleiromavingue.App.dtos.client_area;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record           ClientAreaAccountUpdateDTO(
        @NotBlank(message = "Nome e obrigatorio")
        @Size(max = 120, message = "Nome excede o limite permitido")
        String nome,

        @Email(message = "Email invalido")
        @Size(max = 120, message = "Email excede o limite permitido")
        String email,

        @NotBlank(message = "Telefone e obrigatorio")
        @Size(max = 20, message = "Telefone excede o limite permitido")
        String phone
) {
}
