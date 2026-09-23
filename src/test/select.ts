import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Elige una opción en un `Select` de la app.
 *
 * Los desplegables ya no son `<select>` nativos (la lista la pintaba el sistema
 * operativo y no se podía estilar), así que `userEvent.selectOptions` no sirve:
 * hay que abrir el control y pulsar la opción, que es lo que hace una persona.
 *
 *   await chooseOption("Filtrar usuarios", "Administradores");
 *
 * `name` es el nombre accesible del control (el `label` que recibe el Select);
 * si en la pantalla solo hay uno, se puede omitir.
 */
export async function chooseOption(name: string | undefined, optionLabel: string) {
  const trigger = name
    ? screen.getByRole("combobox", { name })
    : screen.getByRole("combobox");

  await userEvent.click(trigger);

  // Radix pinta la lista en un portal, con role="listbox".
  const listbox = await screen.findByRole("listbox");
  await userEvent.click(within(listbox).getByRole("option", { name: optionLabel }));
}
