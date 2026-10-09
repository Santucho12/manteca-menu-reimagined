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
          comentario_revision: string | null
          credito_centavos: number
          debito_centavos: number
          efectivo_centavos: number
          esperado_credito_centavos: number | null
          esperado_debito_centavos: number | null
          esperado_efectivo_centavos: number | null
          esperado_qr_centavos: number | null
          esperado_transferencia_centavos: number | null
          estado: Database["public"]["Enums"]["estado_de_cierre"]
          fecha: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          fecha_revision: string | null
          fondo_inicial_centavos: number
          id: string
          local_id: string
          motivo_anulacion: string | null
          qr_centavos: number
          queda_en_caja_centavos: number
          revisado: boolean
          revisado_por: string | null
          transferencia_centavos: number
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          cargado_por?: string
          comentario?: string | null
          comentario_revision?: string | null
          credito_centavos?: number
          debito_centavos?: number
          efectivo_centavos: number
          esperado_credito_centavos?: number | null
          esperado_debito_centavos?: number | null
          esperado_efectivo_centavos?: number | null
          esperado_qr_centavos?: number | null
          esperado_transferencia_centavos?: number | null
          estado?: Database["public"]["Enums"]["estado_de_cierre"]
          fecha: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fecha_revision?: string | null
          fondo_inicial_centavos: number
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          qr_centavos?: number
          queda_en_caja_centavos: number
          revisado?: boolean
          revisado_por?: string | null
          transferencia_centavos?: number
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          cargado_por?: string
          comentario?: string | null
          comentario_revision?: string | null
          credito_centavos?: number
          debito_centavos?: number
          efectivo_centavos?: number
          esperado_credito_centavos?: number | null
          esperado_debito_centavos?: number | null
          esperado_efectivo_centavos?: number | null
          esperado_qr_centavos?: number | null
          esperado_transferencia_centavos?: number | null
          estado?: Database["public"]["Enums"]["estado_de_cierre"]
          fecha?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fecha_revision?: string | null
          fondo_inicial_centavos?: number
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          qr_centavos?: number
          queda_en_caja_centavos?: number
          revisado?: boolean
          revisado_por?: string | null
          transferencia_centavos?: number
        }
        Relationships: [
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
      configuracion_de_caja: {
        Row: {
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          tolerancia_centavos: number
        }
        Insert: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          tolerancia_centavos?: number
        }
        Update: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          tolerancia_centavos?: number
        }
        Relationships: []
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
        ]
      }
      gastos: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          categoria_id: string
          cierre_id: string | null
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
          proveedor_id: string | null
          recurrente_id: string | null
          vencimiento: string | null
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id: string
          cierre_id?: string | null
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
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento?: string | null
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id?: string
          cierre_id?: string | null
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
      gastos_recurrentes: {
        Row: {
          activo: boolean
          categoria_id: string
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
          id: string
          local_id: string
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          nombre: string
          orden: number
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
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
      cierres_fondo_sugerido: { Args: { la_fecha: string }; Returns: number }
      cierres_guardar: { Args: { datos: Json }; Returns: string }
      es_admin_activo: { Args: never; Returns: boolean }
      es_caja_activa: { Args: never; Returns: boolean }
      generar_gastos_recurrentes: { Args: { hasta: string }; Returns: number }
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
      registrar_cambio_de_contrasena: {
        Args: { cuenta: string; por: string; tipo: string }
        Returns: undefined
      }
      rol_de_cuenta_nueva: {
        Args: { cuentas: number }
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      tiene_precio: { Args: { el_producto: string }; Returns: boolean }
      usar_accion: {
        Args: { cuenta: string; tipos: string[] }
        Returns: Record<string, unknown>
      }
    }
    Enums: {
      estado_de_cierre:
        | "esperando_ventas"
        | "cierra"
        | "con_diferencia"
        | "revisado"
        | "anulado"
      etiqueta_de_producto: "mas_vendido" | "artesanal" | "nuevo"
      frecuencia_de_gasto: "mensual" | "bimestral" | "anual"
      medio_de_pago: "efectivo_caja" | "transferencia" | "tarjeta" | "otro"
      rol_usuario: "invitado" | "caja" | "encargado" | "admin"
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
      estado_de_cierre: [
        "esperando_ventas",
        "cierra",
        "con_diferencia",
        "revisado",
        "anulado",
      ],
      etiqueta_de_producto: ["mas_vendido", "artesanal", "nuevo"],
      frecuencia_de_gasto: ["mensual", "bimestral", "anual"],
      medio_de_pago: ["efectivo_caja", "transferencia", "tarjeta", "otro"],
      rol_usuario: ["invitado", "caja", "encargado", "admin"],
    },
  },
} as const
