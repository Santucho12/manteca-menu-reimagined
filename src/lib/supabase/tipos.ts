export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      acciones_de_cuenta: {
        Row: {
          cuenta_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_uso: string | null
          id: string
          por: string | null
          tipo: string
        }
        Insert: {
          cuenta_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_uso?: string | null
          id?: string
          por?: string | null
          tipo: string
        }
        Update: {
          cuenta_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_uso?: string | null
          id?: string
          por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acciones_de_cuenta_por_fkey"
            columns: ["por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          antes: Json | null
          despues: Json | null
          fecha: string
          id: number
          local_id: string | null
          motivo: string | null
          registro_id: string
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          antes?: Json | null
          despues?: Json | null
          fecha?: string
          id?: never
          local_id?: string | null
          motivo?: string | null
          registro_id: string
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          antes?: Json | null
          despues?: Json | null
          fecha?: string
          id?: never
          local_id?: string | null
          motivo?: string | null
          registro_id?: string
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aumentos: {
        Row: {
          categoria_id: string | null
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          porcentaje: number
          redondeo_centavos: number
          usuario_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          porcentaje: number
          redondeo_centavos: number
          usuario_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          porcentaje?: number
          redondeo_centavos?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aumentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aumentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "aumentos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aumentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      canales_de_venta: {
        Row: {
          activo: boolean
          de_sistema: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          orden: number
          se_controla_en_el_cierre: boolean
        }
        Insert: {
          activo?: boolean
          de_sistema?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre: string
          orden?: number
          se_controla_en_el_cierre?: boolean
        }
        Update: {
          activo?: boolean
          de_sistema?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          se_controla_en_el_cierre?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "canales_de_venta_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          foto: string | null
          icono: string
          id: string
          local_id: string
          nombre: string
          orden: number
          subtitulo: string | null
          visible: boolean
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          foto?: string | null
          icono: string
          id?: string
          local_id: string
          nombre: string
          orden: number
          subtitulo?: string | null
          visible?: boolean
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          foto?: string | null
          icono?: string
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          subtitulo?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "categorias_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_de_gasto: {
        Row: {
          activo: boolean
          de_sistema: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          pide_proveedor: boolean
        }
        Insert: {
          activo?: boolean
          de_sistema?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre: string
          pide_proveedor?: boolean
        }
        Update: {
          activo?: boolean
          de_sistema?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          pide_proveedor?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "categorias_de_gasto_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      cierres_de_caja: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          cargado_por: string
          comentario: string | null
          credito_centavos: number
          debito_centavos: number
          efectivo_centavos: number
          fecha: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          fondo_inicial_centavos: number
          id: string
          local_id: string
          motivo_anulacion: string | null
          qr_centavos: number
          queda_en_caja_centavos: number
          transferencia_centavos: number
          turno: number
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          cargado_por?: string
          comentario?: string | null
          credito_centavos?: number
          debito_centavos?: number
          efectivo_centavos: number
          fecha: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fondo_inicial_centavos: number
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          qr_centavos?: number
          queda_en_caja_centavos: number
          transferencia_centavos?: number
          turno?: number
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          cargado_por?: string
          comentario?: string | null
          credito_centavos?: number
          debito_centavos?: number
          efectivo_centavos?: number
          fecha?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fondo_inicial_centavos?: number
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          qr_centavos?: number
          queda_en_caja_centavos?: number
          transferencia_centavos?: number
          turno?: number
        }
        Relationships: [
          {
            foreignKeyName: "cierres_de_caja_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_de_caja_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_de_caja_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      compras: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          clave: string | null
          creado_por: string | null
          estado: Database["public"]["Enums"]["estado_de_compra"]
          factura: string | null
          fecha: string | null
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          gasto_id: string | null
          id: string
          local_id: string
          motivo_anulacion: string | null
          otros_cargos_centavos: number
          por_pagar_id: string | null
          proveedor_id: string
          total_centavos: number
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          clave?: string | null
          creado_por?: string | null
          estado: Database["public"]["Enums"]["estado_de_compra"]
          factura?: string | null
          fecha?: string | null
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          gasto_id?: string | null
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          otros_cargos_centavos?: number
          por_pagar_id?: string | null
          proveedor_id: string
          total_centavos?: number
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          clave?: string | null
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_de_compra"]
          factura?: string | null
          fecha?: string | null
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          gasto_id?: string | null
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          otros_cargos_centavos?: number
          por_pagar_id?: string | null
          proveedor_id?: string
          total_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_por_pagar_id_fkey"
            columns: ["por_pagar_id"]
            isOneToOne: false
            referencedRelation: "gastos_por_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_de_caja: {
        Row: {
          fecha_actualizacion: string
          fecha_creacion: string
          hora_cierre_mediodia: string
          hora_cierre_noche: string
          id: string
          local_id: string
          tolerancia_centavos: number
        }
        Insert: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          hora_cierre_mediodia?: string
          hora_cierre_noche?: string
          id?: string
          local_id: string
          tolerancia_centavos?: number
        }
        Update: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          hora_cierre_mediodia?: string
          hora_cierre_noche?: string
          id?: string
          local_id?: string
          tolerancia_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_de_caja_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: true
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_de_costos: {
        Row: {
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          margen_minimo_porcentaje: number
          margen_objetivo_porcentaje: number
        }
        Insert: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          margen_minimo_porcentaje?: number
          margen_objetivo_porcentaje?: number
        }
        Update: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          margen_minimo_porcentaje?: number
          margen_objetivo_porcentaje?: number
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_de_costos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: true
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_de_cierre: {
        Row: {
          canal_id: string
          cantidad: number | null
          cierre_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          total_centavos: number
        }
        Insert: {
          canal_id: string
          cantidad?: number | null
          cierre_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          total_centavos: number
        }
        Update: {
          canal_id?: string
          cantidad?: number | null
          cierre_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          total_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "controles_de_cierre_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canales_de_venta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_de_cierre_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_de_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_de_cierre_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      costos_de_presentacion: {
        Row: {
          agregado_centavos: number
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          presentacion_id: string
          unidades: number
        }
        Insert: {
          agregado_centavos?: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          presentacion_id: string
          unidades: number
        }
        Update: {
          agregado_centavos?: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          presentacion_id?: string
          unidades?: number
        }
        Relationships: [
          {
            foreignKeyName: "costos_de_presentacion_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costos_de_presentacion_presentacion_id_fkey"
            columns: ["presentacion_id"]
            isOneToOne: true
            referencedRelation: "presentaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      dias_sin_abrir: {
        Row: {
          activo: boolean
          fecha: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          marcado_por: string
        }
        Insert: {
          activo?: boolean
          fecha: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          marcado_por?: string
        }
        Update: {
          activo?: boolean
          fecha?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          marcado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "dias_sin_abrir_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dias_sin_abrir_marcado_por_fkey"
            columns: ["marcado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_de_compra: {
        Row: {
          activo: boolean
          como_se_compra: string
          contenido: number
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          insumo_id: string
          local_id: string
          precio_referencia_centavos: number | null
          proveedor_id: string | null
        }
        Insert: {
          activo?: boolean
          como_se_compra: string
          contenido: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          insumo_id: string
          local_id?: string
          precio_referencia_centavos?: number | null
          proveedor_id?: string | null
        }
        Update: {
          activo?: boolean
          como_se_compra?: string
          contenido?: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          insumo_id?: string
          local_id?: string
          precio_referencia_centavos?: number | null
          proveedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formas_de_compra_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formas_de_compra_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formas_de_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          categoria_id: string
          cierre_id: string | null
          clave: string | null
          compra_id: string | null
          comprobante: string | null
          creado_por: string | null
          descripcion: string | null
          fecha: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          id: string
          local_id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          motivo_anulacion: string | null
          por_pagar_id: string | null
          proveedor_id: string | null
          recurrente_id: string | null
          vencimiento: string | null
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id: string
          cierre_id?: string | null
          clave?: string | null
          compra_id?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          motivo_anulacion?: string | null
          por_pagar_id?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento?: string | null
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id?: string
          cierre_id?: string | null
          clave?: string | null
          compra_id?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos?: number
          motivo_anulacion?: string | null
          por_pagar_id?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_de_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_id_fkey"
            columns: ["por_pagar_id"]
            isOneToOne: false
            referencedRelation: "gastos_por_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrente_id_fkey"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "gastos_recurrentes"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_por_pagar: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          categoria_id: string
          clave: string | null
          compra_id: string | null
          comprobante: string | null
          creado_por: string | null
          descripcion: string | null
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          id: string
          local_id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"] | null
          monto_centavos: number
          motivo_anulacion: string | null
          proveedor_id: string | null
          recurrente_id: string | null
          vencimiento: string
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id: string
          clave?: string | null
          compra_id?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"] | null
          monto_centavos: number
          motivo_anulacion?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento: string
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id?: string
          clave?: string | null
          compra_id?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"] | null
          monto_centavos?: number
          motivo_anulacion?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_por_pagar_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_recurrente_id_fkey"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "gastos_recurrentes"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_recurrentes: {
        Row: {
          activo: boolean
          categoria_id: string
          clave: string | null
          creado_por: string | null
          descripcion: string | null
          fecha_actualizacion: string
          fecha_creacion: string
          frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          generar_desde: string | null
          id: string
          local_id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          primer_vencimiento: string
          proveedor_id: string | null
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          clave?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          generar_desde?: string | null
          id?: string
          local_id?: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          primer_vencimiento: string
          proveedor_id?: string | null
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          clave?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          frecuencia?: Database["public"]["Enums"]["frecuencia_de_gasto"]
          generar_desde?: string | null
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos?: number
          primer_vencimiento?: string
          proveedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_recurrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrentes_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrentes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrentes_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          observaciones: string | null
          unidad_de_uso: Database["public"]["Enums"]["unidad_de_uso"]
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre: string
          observaciones?: string | null
          unidad_de_uso: Database["public"]["Enums"]["unidad_de_uso"]
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          observaciones?: string | null
          unidad_de_uso?: Database["public"]["Enums"]["unidad_de_uso"]
        }
        Relationships: [
          {
            foreignKeyName: "insumos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      pagos_de_venta: {
        Row: {
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          medio: Database["public"]["Enums"]["medio_de_caja"]
          monto_centavos: number
          venta_id: string
        }
        Insert: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          medio: Database["public"]["Enums"]["medio_de_caja"]
          monto_centavos: number
          venta_id: string
        }
        Update: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio?: Database["public"]["Enums"]["medio_de_caja"]
          monto_centavos?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_de_venta_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_de_venta_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          debe_cambiar_contrasena: boolean
          email: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          pendiente: boolean | null
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          activo?: boolean
          debe_cambiar_contrasena?: boolean
          email: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id: string
          local_id: string
          nombre: string
          pendiente?: boolean | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          activo?: boolean
          debe_cambiar_contrasena?: boolean
          email?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          pendiente?: boolean | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      postergaciones_de_cierre: {
        Row: {
          desde: string
          fecha: string
          fecha_actualizacion: string
          fecha_creacion: string
          hasta: string
          id: string
          local_id: string
          postergado_por: string
          turno: number
        }
        Insert: {
          desde: string
          fecha: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          hasta: string
          id?: string
          local_id?: string
          postergado_por?: string
          turno: number
        }
        Update: {
          desde?: string
          fecha?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          hasta?: string
          id?: string
          local_id?: string
          postergado_por?: string
          turno?: number
        }
        Relationships: [
          {
            foreignKeyName: "postergaciones_de_cierre_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postergaciones_de_cierre_postergado_por_fkey"
            columns: ["postergado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      precios: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          monto_centavos: number
          presentacion_id: string
          producto_id: string | null
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          monto_centavos: number
          presentacion_id: string
          producto_id?: string | null
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          monto_centavos?: number
          presentacion_id?: string
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_presentacion_id_fkey"
            columns: ["presentacion_id"]
            isOneToOne: false
            referencedRelation: "presentaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "precios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      presentaciones: {
        Row: {
          activo: boolean
          categoria_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          gramos: number | null
          id: string
          local_id: string
          nombre: string
          orden: number
          unidades: number | null
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          gramos?: number | null
          id?: string
          local_id: string
          nombre: string
          orden: number
          unidades?: number | null
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          gramos?: number | null
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          unidades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "presentaciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentaciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "presentaciones_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          categoria_id: string
          descripcion: string | null
          etiqueta: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          orden: number
          visible: boolean
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          descripcion?: string | null
          etiqueta?: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          nombre: string
          orden: number
          visible?: boolean
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          descripcion?: string | null
          etiqueta?: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "productos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          observaciones: string | null
          que_compra: string | null
          telefono: string | null
          ubicacion: string | null
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre: string
          observaciones?: string | null
          que_compra?: string | null
          telefono?: string | null
          ubicacion?: string | null
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          observaciones?: string | null
          que_compra?: string | null
          telefono?: string | null
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      recetas: {
        Row: {
          activo: boolean
          desperdicio_porcentaje: number
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          presentacion_id: string | null
          producto_id: string
          rinde: number
        }
        Insert: {
          activo?: boolean
          desperdicio_porcentaje?: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          presentacion_id?: string | null
          producto_id: string
          rinde?: number
        }
        Update: {
          activo?: boolean
          desperdicio_porcentaje?: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          presentacion_id?: string | null
          producto_id?: string
          rinde?: number
        }
        Relationships: [
          {
            foreignKeyName: "recetas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_presentacion_id_fkey"
            columns: ["presentacion_id"]
            isOneToOne: false
            referencedRelation: "presentaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "recetas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      renglones_de_compra: {
        Row: {
          cantidad: number
          cantidad_pedida: number | null
          compra_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          forma_de_compra_id: string
          id: string
          local_id: string
          precio_unitario_centavos: number
          subtotal_centavos: number
        }
        Insert: {
          cantidad?: number
          cantidad_pedida?: number | null
          compra_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          forma_de_compra_id: string
          id?: string
          local_id: string
          precio_unitario_centavos?: number
          subtotal_centavos?: number
        }
        Update: {
          cantidad?: number
          cantidad_pedida?: number | null
          compra_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          forma_de_compra_id?: string
          id?: string
          local_id?: string
          precio_unitario_centavos?: number
          subtotal_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "renglones_de_compra_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_compra_forma_de_compra_id_fkey"
            columns: ["forma_de_compra_id"]
            isOneToOne: false
            referencedRelation: "formas_de_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_compra_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      renglones_de_receta: {
        Row: {
          activo: boolean
          cantidad: number
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          insumo_id: string
          local_id: string
          receta_id: string
        }
        Insert: {
          activo?: boolean
          cantidad: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          insumo_id: string
          local_id: string
          receta_id: string
        }
        Update: {
          activo?: boolean
          cantidad?: number
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          insumo_id?: string
          local_id?: string
          receta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renglones_de_receta_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_receta_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_receta_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas"
            referencedColumns: ["id"]
          },
        ]
      }
      renglones_de_venta: {
        Row: {
          cantidad: number
          costo_unitario_centavos: number | null
          descripcion: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          precio_unitario_centavos: number
          presentacion_id: string | null
          producto_id: string | null
          subtotal_centavos: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario_centavos?: number | null
          descripcion: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          precio_unitario_centavos: number
          presentacion_id?: string | null
          producto_id?: string | null
          subtotal_centavos: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario_centavos?: number | null
          descripcion?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          precio_unitario_centavos?: number
          presentacion_id?: string | null
          producto_id?: string | null
          subtotal_centavos?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renglones_de_venta_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_venta_presentacion_id_fkey"
            columns: ["presentacion_id"]
            isOneToOne: false
            referencedRelation: "presentaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_venta_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "renglones_de_venta_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_venta_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      retiros_de_caja: {
        Row: {
          cierre_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          monto_centavos: number
          quien: string
        }
        Insert: {
          cierre_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          monto_centavos: number
          quien: string
        }
        Update: {
          cierre_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          monto_centavos?: number
          quien?: string
        }
        Relationships: [
          {
            foreignKeyName: "retiros_de_caja_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_de_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retiros_de_caja_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          canal_id: string | null
          cerrada_en: string | null
          clave: string | null
          comentario: string | null
          creado_por: string | null
          en_la_caja: boolean
          estado: Database["public"]["Enums"]["estado_de_venta"]
          fecha: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          fudo_id: string | null
          id: string
          local_id: string
          motivo_anulacion: string | null
          origen: Database["public"]["Enums"]["origen_de_venta"]
          total_centavos: number
          turno: number
          editada: boolean
          editada_por: string | null
          fecha_edicion: string | null
          motivo_edicion: string | null
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          canal_id?: string | null
          cerrada_en?: string | null
          clave?: string | null
          comentario?: string | null
          creado_por?: string | null
          en_la_caja?: boolean
          estado?: Database["public"]["Enums"]["estado_de_venta"]
          fecha: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fudo_id?: string | null
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          origen?: Database["public"]["Enums"]["origen_de_venta"]
          total_centavos: number
          turno?: number
          editada?: boolean
          editada_por?: string | null
          fecha_edicion?: string | null
          motivo_edicion?: string | null
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          canal_id?: string | null
          cerrada_en?: string | null
          clave?: string | null
          comentario?: string | null
          creado_por?: string | null
          en_la_caja?: boolean
          estado?: Database["public"]["Enums"]["estado_de_venta"]
          fecha?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fudo_id?: string | null
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          origen?: Database["public"]["Enums"]["origen_de_venta"]
          total_centavos?: number
          turno?: number
          editada?: boolean
          editada_por?: string | null
          fecha_edicion?: string | null
          motivo_edicion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canales_de_venta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      menu_publico: {
        Row: {
          categoria: string | null
          categoria_id: string | null
          compartidos: Json | null
          descripcion: string | null
          etiqueta: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          foto: string | null
          icono: string | null
          nombre: string | null
          orden: number | null
          orden_categoria: number | null
          precios: Json | null
          producto_id: string | null
          subtitulo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      caja_dia_sin_abrir: {
        Args: { el_local: string; la_fecha: string }
        Returns: boolean
      }
      caja_estado_del_mostrador: {
        Args: never
        Returns: {
          fecha: string
          fecha_trabada: string
          hora_de_corte: string
          motivo: string
          postergado_hasta: string
          proxima_hora: string
          trabado: boolean
          turno: number
          turno_trabado: number
        }[]
      }
      caja_estado_del_turno: {
        Args: { momento: string }
        Returns: {
          fecha: string
          fecha_trabada: string
          hora_de_corte: string
          motivo: string
          postergado_hasta: string
          proxima_hora: string
          trabado: boolean
          turno: number
          turno_trabado: number
        }[]
      }
      caja_hora_del_turno: {
        Args: { el_local: string; el_turno: number }
        Returns: string
      }
      caja_mediodia_sin_cerrar: {
        Args: { el_local: string; la_fecha: string }
        Returns: boolean
      }
      caja_postergar_cierre: { Args: never; Returns: string }
      caja_tipos_para_vender: {
        Args: never
        Returns: {
          de_sistema: boolean
          id: string
          nombre: string
          se_controla_en_el_cierre: boolean
        }[]
      }
      caja_turno_con_cierre: {
        Args: { el_local: string; el_turno: number; la_fecha: string }
        Returns: boolean
      }
      caja_turno_con_ventas: {
        Args: { el_local: string; el_turno: number; la_fecha: string }
        Returns: boolean
      }
      caja_turno_de_ayer_sin_cerrar: {
        Args: { ayer: string; el_local: string }
        Returns: number
      }
      caja_turno_de_la_venta: {
        Args: { el_local: string; la_fecha: string }
        Returns: number
      }
      catalogo_para_vender: {
        Args: never
        Returns: {
          categoria: string
          categoria_id: string
          compartido: boolean
          gramos: number | null
          precio_centavos: number
          presentacion: string
          presentacion_id: string
          producto: string
          producto_id: string
          unidades: number | null
        }[]
      }
      cierres_anotar_controles: {
        Args: { datos: Json; el_cierre: string; el_local: string }
        Returns: undefined
      }
      cierres_con_resultado: {
        Args: { desde: string; hasta: string; persona?: string }
        Returns: {
          anulado: boolean
          cargado_por: string
          comentario: string
          credito_centavos: number
          debito_centavos: number
          efectivo_centavos: number
          fecha: string
          fondo_inicial_centavos: number
          gastos_centavos: number
          id: string
          motivo_anulacion: string
          persona_nombre: string
          qr_centavos: number
          queda_en_caja_centavos: number
          retiros_centavos: number
          tolerancia_centavos: number
          transferencia_centavos: number
          turno: number
          ventas_credito_centavos: number
          ventas_debito_centavos: number
          ventas_efectivo_centavos: number
          ventas_qr_centavos: number
          ventas_transferencia_centavos: number
        }[]
      }
      cierres_controles: {
        Args: { desde: string; hasta: string }
        Returns: {
          canal_id: string
          cantidad: number
          cierre_id: string
          tipo: string
          total_centavos: number
          ventas_cantidad: number
          ventas_centavos: number
        }[]
      }
      cierres_editar: {
        Args: { datos: Json; el_id: string }
        Returns: undefined
      }
      cierres_editar_caja: {
        Args: { datos: Json; el_id: string }
        Returns: undefined
      }
      cierres_exigir_quien_carga: { Args: never; Returns: undefined }
      cierres_fecha_del_fondo: {
        Args: { el_turno?: number; la_fecha: string }
        Returns: string
      }
      cierres_fondo_sugerido: {
        Args: { el_turno?: number; la_fecha: string }
        Returns: number
      }
      cierres_fondos_anteriores: {
        Args: { ids: string[] }
        Returns: {
          fondo_anterior_centavos: number
          id: string
        }[]
      }
      cierres_guardar: { Args: { datos: Json }; Returns: string }
      cierres_guardar_caja: { Args: { datos: Json }; Returns: string }
      cierres_insertar: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      cierres_marcar_sin_abrir: {
        Args: { la_fecha: string; marcar: boolean }
        Returns: undefined
      }
      cierres_turnos_pendientes: {
        Args: { desde: string; hasta: string; momento?: string }
        Returns: {
          fecha: string
          turno: number
        }[]
      }
      compras_anular: {
        Args: { la_compra: string; motivo: string }
        Returns: undefined
      }
      compras_cargar_renglones: {
        Args: { el_local: string; la_compra: string; renglones: Json }
        Returns: undefined
      }
      compras_categoria: {
        Args: { el_local: string; el_nombre: string }
        Returns: string
      }
      compras_controlar: {
        Args: { el_local: string; el_proveedor: string; renglones: Json }
        Returns: undefined
      }
      compras_desde_gasto: { Args: { datos: Json }; Returns: string }
      compras_exigir_admin: { Args: never; Returns: undefined }
      compras_generar_pago: {
        Args: { la_compra: string; pago: Json }
        Returns: undefined
      }
      compras_pedir: { Args: { datos: Json }; Returns: string }
      compras_recibir: { Args: { datos: Json }; Returns: string }
      compras_ya_cargada: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      costo_de_insumos: {
        Args: never
        Returns: {
          costo_por_unidad: number
          fecha_origen: string
          insumo_id: string
          origen: string
        }[]
      }
      costos_de_productos: {
        Args: never
        Returns: {
          costo_centavos: number
          estado: string
          presentacion_id: string
          producto_id: string
        }[]
      }
      costos_de_productos_del_local: {
        Args: { el_local: string }
        Returns: {
          costo_centavos: number
          estado: string
          presentacion_id: string
          producto_id: string
        }[]
      }
      es_admin_activo: { Args: never; Returns: boolean }
      es_caja_activa: { Args: never; Returns: boolean }
      es_vencimiento_del_fijo: {
        Args: {
          el_dia: string
          la_frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          primero: string
        }
        Returns: boolean
      }
      ganancia_por_producto: {
        Args: { desde: string; hasta: string }
        Returns: {
          costo_centavos: number
          ganancia_centavos: number
          producto: string
          producto_id: string
          sin_costo: number
          unidades: number
          ventas_centavos: number
        }[]
      }
      gastos_exigir_medio: {
        Args: { anterior: string; nuevo: string }
        Returns: undefined
      }
      gastos_pagado_por_proveedor: {
        Args: { desde: string; hasta: string }
        Returns: {
          proveedor_id: string
          total_centavos: number
        }[]
      }
      gastos_total: {
        Args: {
          desde: string
          el_proveedor?: string
          el_tipo?: string
          hasta: string
          la_categoria?: string
        }
        Returns: number
      }
      gastos_validar_categoria_y_proveedor: {
        Args: {
          el_local: string
          el_proveedor: string
          la_categoria: string
          proveedor_anterior: string
        }
        Returns: undefined
      }
      generar_gastos_recurrentes: { Args: { hasta: string }; Returns: number }
      generar_por_pagar: {
        Args: { el_fijo?: string; hasta: string }
        Returns: number
      }
      local_del_usuario: { Args: never; Returns: string }
      menu_aplicar_aumento: { Args: { datos: Json }; Returns: string }
      menu_aumento_vigente: {
        Args: { el_local: string; la_categoria: string; recibidos: Json }
        Returns: boolean
      }
      menu_cambiar_visibilidad: {
        Args: { el_id: string; el_tipo: string; mostrar: boolean }
        Returns: undefined
      }
      menu_desactivar: {
        Args: { el_id: string; el_tipo: string }
        Returns: undefined
      }
      menu_escribir_categoria: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      menu_escribir_precios_del_producto: {
        Args: { el_local: string; el_producto: string; lista: Json }
        Returns: undefined
      }
      menu_escribir_presentaciones: {
        Args: { el_local: string; la_categoria: string; lista: Json }
        Returns: undefined
      }
      menu_escribir_producto: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      menu_exigir_admin: { Args: never; Returns: string }
      menu_guardar_categoria: {
        Args: { confirmar?: boolean; datos: Json }
        Returns: Json
      }
      menu_guardar_producto: {
        Args: { confirmar?: boolean; datos: Json }
        Returns: Json
      }
      menu_intercambiar_orden: {
        Args: { el_tipo: string; otro: string; uno: string }
        Returns: undefined
      }
      menu_mover: {
        Args: { direccion: string; el_id: string; el_tipo: string }
        Returns: undefined
      }
      menu_no_encontrado: { Args: never; Returns: undefined }
      menu_ocultar_sin_precio: {
        Args: { confirmar: boolean; las_categorias: string[] }
        Returns: Json
      }
      menu_poner_precio: {
        Args: {
          el_local: string
          el_producto: string
          la_presentacion: string
          monto: number
        }
        Returns: undefined
      }
      menu_precios_del_alcance: {
        Args: { el_local: string; la_categoria: string }
        Returns: {
          id: string
          monto_centavos: number
        }[]
      }
      menu_reactivar: {
        Args: { el_id: string; el_tipo: string }
        Returns: undefined
      }
      menu_validar_foto: {
        Args: { el_local: string; la_foto: string }
        Returns: string
      }
      menu_vecino: {
        Args: { direccion: string; el_id: string; el_tipo: string }
        Returns: string
      }
      pagos_pendientes: {
        Args: never
        Returns: {
          categoria: string
          descripcion: string
          frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          proveedor: string
          recurrente_id: string
          vencimiento: string
        }[]
      }
      recetas_controlar: {
        Args: { datos: Json; el_local: string }
        Returns: undefined
      }
      recetas_guardar: { Args: { datos: Json }; Returns: string }
      recetas_usar_la_del_producto: {
        Args: { el_producto: string; la_presentacion: string }
        Returns: undefined
      }
      registrar_cambio_de_contrasena: {
        Args: { cuenta: string; por: string; tipo: string }
        Returns: undefined
      }
      reporte_gastos: {
        Args: { desde: string; hasta: string }
        Returns: {
          categoria: string
          categoria_id: string
          dia: string
          monto_centavos: number
        }[]
      }
      reporte_ventas_por_categoria: {
        Args: { desde: string; hasta: string }
        Returns: {
          categoria: string
          categoria_id: string
          monto_centavos: number
          ventas: number
        }[]
      }
      reporte_ventas_por_dia: {
        Args: { desde: string; hasta: string }
        Returns: {
          dia: string
          monto_centavos: number
          ventas: number
        }[]
      }
      reporte_ventas_por_producto: {
        Args: { desde: string; hasta: string }
        Returns: {
          cantidad: number
          categoria: string
          categoria_id: string
          monto_centavos: number
          presentacion: string
          producto: string
          producto_id: string
        }[]
      }
      reporte_ventas_por_tipo: {
        Args: { desde: string; hasta: string }
        Returns: {
          canal_id: string
          monto_centavos: number
          tipo: string
          ventas: number
        }[]
      }
      reportes_exigir_admin: { Args: never; Returns: undefined }
      rol_de_cuenta_nueva: {
        Args: { cuentas: number }
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      tiene_precio: { Args: { el_producto: string }; Returns: boolean }
      usar_accion: {
        Args: { cuenta: string; tipos: string[] }
        Returns: Record<string, unknown>
      }
      ventas_borrar_canal: { Args: { el_canal: string }; Returns: undefined }
      ventas_guardar_manual: { Args: { datos: Json }; Returns: string }
      ventas_armar: { Args: { detalle: Json; el_renglon: string }; Returns: undefined }
      ventas_editar: { Args: { datos: Json; el_motivo: string; la_venta: string }; Returns: Json }
      ventas_ordenar_canales: { Args: { los_ids: string[] }; Returns: undefined }
      ventas_guardar_mostrador: { Args: { datos: Json }; Returns: Json }
      ventas_por_armar: {
        Args: never
        Returns: {
          categoria_id: string
          cerrada_en: string
          descripcion: string
          renglon_id: string
          unidades: number
          venta_id: string
        }[]
      }
      ventas_renglones_del_mostrador: {
        Args: { datos: Json; el_local: string }
        Returns: {
          cantidad: number
          categoria_id: string
          compartido: boolean
          descripcion: string
          gramos: number | null
          mandado_centavos: number
          orden: number
          precio_centavos: number
          presentacion_id: string
          producto_id: string
          solo_centavos: number
          unidades: number | null
        }[]
      }
      ventas_tipo_del_mostrador: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      ventas_totales: {
        Args: {
          desde: string
          el_canal?: string
          el_creador?: string
          el_medio?: string
          el_origen?: string
          hasta: string
        }
        Returns: {
          anuladas: number
          anulado_centavos: number
          canceladas: number
          cancelado_centavos: number
          cobradas: number
          cobrado_centavos: number
        }[]
      }
      ventas_validar_manual: {
        Args: { datos: Json; el_local: string }
        Returns: undefined
      }
      ventas_validar_mostrador: {
        Args: { datos: Json; el_local: string }
        Returns: number
      }
      ventas_validar_pagos_del_mostrador: {
        Args: { datos: Json; el_total: number }
        Returns: undefined
      }
    }
    Enums: {
      estado_de_compra: "pedida" | "recibida"
      estado_de_venta: "cerrada" | "cancelada" | "en_curso"
      etiqueta_de_producto: "mas_vendido" | "artesanal" | "nuevo"
      frecuencia_de_gasto: "mensual" | "bimestral" | "anual"
      medio_de_caja:
        | "efectivo"
        | "credito"
        | "debito"
        | "qr"
        | "transferencia"
        | "fuera_de_caja"
      medio_de_pago:
        | "efectivo_caja"
        | "transferencia"
        | "tarjeta"
        | "otro"
        | "efectivo"
        | "cheque"
      origen_de_venta: "manual" | "fudo" | "mostrador"
      rol_usuario: "invitado" | "caja" | "encargado" | "admin"
      unidad_de_uso: "g" | "ml" | "unidad"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_de_compra: ["pedida", "recibida"],
      estado_de_venta: ["cerrada", "cancelada", "en_curso"],
      etiqueta_de_producto: ["mas_vendido", "artesanal", "nuevo"],
      frecuencia_de_gasto: ["mensual", "bimestral", "anual"],
      medio_de_caja: [
        "efectivo",
        "credito",
        "debito",
        "qr",
        "transferencia",
        "fuera_de_caja",
      ],
      medio_de_pago: [
        "efectivo_caja",
        "transferencia",
        "tarjeta",
        "otro",
        "efectivo",
        "cheque",
      ],
      origen_de_venta: ["manual", "fudo", "mostrador"],
      rol_usuario: ["invitado", "caja", "encargado", "admin"],
      unidad_de_uso: ["g", "ml", "unidad"],
    },
  },
} as const
