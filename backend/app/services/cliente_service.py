from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import date

from app.models.cliente import Cliente

class ClienteService:
    @staticmethod
    def listar_clientes(
        db: Session,
        nome: Optional[str] = None,
        sobrenome: Optional[str] = None,
        email: Optional[str] = None,
        cidade: Optional[str] = None,
        estado: Optional[str] = None,
        pais: Optional[str] = None,
        genero: Optional[str] = None,
        origem: Optional[str] = None,
        idade_min: Optional[int] = None,
        idade_max: Optional[int] = None,
        busca: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Cliente]:
        query = db.query(Cliente)

        # Busca geral
        if busca:
            query = query.filter(
                or_(
                    Cliente.nome_cliente.ilike(f"%{busca}%"),
                    Cliente.sobrenome_cliente.ilike(f"%{busca}%"),
                    Cliente.email_cliente.ilike(f"%{busca}%"),
                )
            )

        # Filtros específicos
        if nome:
            query = query.filter(Cliente.nome_cliente.ilike(f"%{nome}%"))
        if sobrenome:
            query = query.filter(Cliente.sobrenome_cliente.ilike(f"%{sobrenome}%"))
        if email:
            query = query.filter(Cliente.email_cliente.ilike(f"%{email}%"))
        if cidade:
            query = query.filter(Cliente.cidade_cliente.ilike(f"%{cidade}%"))
        if estado:
            query = query.filter(Cliente.estado_cliente.ilike(f"%{estado}%"))
        if pais:
            query = query.filter(Cliente.pais_cliente.ilike(f"%{pais}%"))
        if genero:
            query = query.filter(Cliente.genero_cliente == genero)
        if origem:
            query = query.filter(Cliente.origem_cliente == origem)

        # Filtro de Idade (Calculado a partir da data de nascimento)
        today = date.today()
        if idade_min is not None:
            try:
                max_birth_date = today.replace(year=today.year - idade_min)
            except ValueError:  # Trata ano bissexto (29 de Fevereiro)
                max_birth_date = today.replace(year=today.year - idade_min, day=28)
            query = query.filter(Cliente.data_nascimento_cliente <= max_birth_date.isoformat())

        if idade_max is not None:
            try:
                min_birth_date = today.replace(year=today.year - (idade_max + 1))
            except ValueError:  # Trata ano bissexto
                min_birth_date = today.replace(year=today.year - (idade_max + 1), day=28)
            query = query.filter(Cliente.data_nascimento_cliente > min_birth_date.isoformat())

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def buscar_cliente(db: Session, cliente_id: str) -> Optional[Cliente]:
        return db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
