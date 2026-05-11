import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/* Esse utilitário serve para evitar conflitos de classes no tailwind
  Combinando as biliotecas:
  clsx: uma função de utilitário para construir strings de classe condicionalmente, se for falso ignora
  tailwind-merge: uma função que mescla classes do tailwind
                  se forem concorrentes usa a última declarada
*/

/*é ideal para componentes com variantes porque posso passar por exemplo um caso de waning no botao
  se for false ele ignroa a classe de warning, se for true passa ele, sem conflitos
*/
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
