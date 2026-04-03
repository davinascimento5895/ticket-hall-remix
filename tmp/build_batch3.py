import json

# Mapeamento original -> {key, en, es}
MAPPING = {
    "\n                Em revenda — R$ ": {
        "key": "tickets.resalePricePrefix",
        "en": "\n                On resale — R$ ",
        "es": "\n                En reventa — R$ "
    },
    " Ver ingresso\n            ": {
        "key": "tickets.viewTicket",
        "en": " View ticket\n            ",
        "es": " Ver entrada\n            "
    },
    "Mais ações": {
        "key": "common.moreActions",
        "en": "More actions",
        "es": "Más acciones"
    },
    " Ver ingresso\n                ": {
        "key": "tickets.viewTicketAlt",
        "en": " View ticket\n                ",
        "es": " Ver entrada\n                "
    },
    " Adicionar ao calendário\n                ": {
        "key": "tickets.addToCalendar",
        "en": " Add to calendar\n                ",
        "es": " Agregar al calendario\n                "
    },
    "Verifique sua caixa de entrada.": {
        "key": "common.checkInbox",
        "en": "Check your inbox.",
        "es": "Revisa tu bandeja de entrada."
    },
    " Reenviar por e-mail\n                ": {
        "key": "tickets.resendByEmail",
        "en": " Resend by email\n                ",
        "es": " Reenviar por correo\n                "
    },
    " Transferir ingresso\n                ": {
        "key": "tickets.transferTicket",
        "en": " Transfer ticket\n                ",
        "es": " Transferir entrada\n                "
    },
    "Revenda indisponível": {
        "key": "tickets.resaleUnavailable",
        "en": "Resale unavailable",
        "es": "Reventa no disponible"
    },
    "Este ingresso não permite revenda para este evento/lote.": {
        "key": "tickets.resaleNotAllowed",
        "en": "This ticket does not allow resale for this event/batch.",
        "es": "Esta entrada no permite reventa para este evento/lote."
    },
    " Cancelar revenda\n                ": {
        "key": "tickets.cancelResale",
        "en": " Cancel resale\n                ",
        "es": " Cancelar reventa\n                "
    },
    " Solicitar reembolso\n                ": {
        "key": "tickets.requestRefund",
        "en": " Request refund\n                ",
        "es": " Solicitar reembolso\n                "
    },
    "Gerencie seus ingressos na TicketHall.": {
        "key": "tickets.manageTicketsDescription",
        "en": "Manage your tickets on TicketHall.",
        "es": "Gestiona tus entradas en TicketHall."
    },
    "Buscar pelo nome, email, ingresso ou pedido": {
        "key": "common.searchByNameEmailTicketOrder",
        "en": "Search by name, email, ticket or order",
        "es": "Buscar por nombre, correo, entrada o pedido"
    },
    "Explore os eventos disponíveis e garanta seus ingressos.": {
        "key": "events.exploreAvailableEvents",
        "en": "Explore available events and get your tickets.",
        "es": "Explora los eventos disponibles y asegura tus entradas."
    },
    "Pagos": {
        "key": "orders.paid",
        "en": "Paid",
        "es": "Pagados"
    },
    "Histórico de pedidos na TicketHall.": {
        "key": "orders.orderHistoryDescription",
        "en": "Order history on TicketHall.",
        "es": "Historial de pedidos en TicketHall."
    },
    "Nenhum pedido encontrado": {
        "key": "orders.noOrdersFound",
        "en": "No orders found",
        "es": "No se encontraron pedidos"
    },
    "Seus pedidos aparecerão aqui após a primeira compra.": {
        "key": "orders.ordersWillAppearHere",
        "en": "Your orders will appear here after your first purchase.",
        "es": "Tus pedidos aparecerán aquí después de tu primera compra."
    },
    "Buscar por evento ou número do pedido...": {
        "key": "orders.searchByEventOrOrderNumber",
        "en": "Search by event or order number...",
        "es": "Buscar por evento o número de pedido..."
    },
    "Tente ajustar seus filtros ou termo de busca.": {
        "key": "common.adjustFiltersOrSearchTerm",
        "en": "Try adjusting your filters or search term.",
        "es": "Intenta ajustar tus filtros o término de búsqueda."
    },
    "x de ": {
        "key": "common.xOf",
        "en": "x of ",
        "es": "x de "
    },
    "\n                            Pedido #": {
        "key": "orders.orderNumberPrefix",
        "en": "\n                            Order #",
        "es": "\n                            Pedido #"
    },
    "\n                      Anterior\n                    ": {
        "key": "common.previousPage",
        "en": "\n                      Previous\n                    ",
        "es": "\n                      Anterior\n                    "
    },
    "\n                      Página ": {
        "key": "common.pagePrefix",
        "en": "\n                      Page ",
        "es": "\n                      Página "
    },
    "\n                      Próxima\n                      ": {
        "key": "common.nextPage",
        "en": "\n                      Next\n                      ",
        "es": "\n                      Siguiente\n                      "
    },
    "Erro no saque": {
        "key": "wallet.withdrawalError",
        "en": "Withdrawal error",
        "es": "Error en el retiro"
    },
    "Saque solicitado": {
        "key": "wallet.withdrawalRequested",
        "en": "Withdrawal requested",
        "es": "Retiro solicitado"
    },
    "Minha Carteira - TicketHall": {
        "key": "wallet.myWalletTitle",
        "en": "My Wallet - TicketHall",
        "es": "Mi Billetera - TicketHall"
    },
    "Gerencie saldo, saques e extrato da revenda oficial.": {
        "key": "wallet.manageBalanceDescription",
        "en": "Manage balance, withdrawals and official resale statement.",
        "es": "Gestiona saldo, retiros y extracto de la reventa oficial."
    },
    "Minha Carteira": {
        "key": "wallet.myWallet",
        "en": "My Wallet",
        "es": "Mi Billetera"
    },
    " Atualizar\n          ": {
        "key": "common.refresh",
        "en": " Refresh\n          ",
        "es": " Actualizar\n          "
    },
    "Saldo disponível": {
        "key": "wallet.availableBalance",
        "en": "Available balance",
        "es": "Saldo disponible"
    },
    "Saldo pendente": {
        "key": "wallet.pendingBalance",
        "en": "Pending balance",
        "es": "Saldo pendiente"
    },
    "Saldo bloqueado": {
        "key": "wallet.blockedBalance",
        "en": "Blocked balance",
        "es": "Saldo bloqueado"
    },
    " Solicitar saque PIX\n            ": {
        "key": "wallet.requestPixWithdrawal",
        "en": " Request PIX withdrawal\n            ",
        "es": " Solicitar retiro PIX\n            "
    },
    "Valor": {
        "key": "common.amount",
        "en": "Amount",
        "es": "Valor"
    },
    "Tipo da chave": {
        "key": "wallet.keyType",
        "en": "Key type",
        "es": "Tipo de clave"
    },
    "Aleatória": {
        "key": "wallet.random",
        "en": "Random",
        "es": "Aleatoria"
    },
    "Chave PIX": {
        "key": "wallet.pixKey",
        "en": "PIX key",
        "es": "Clave PIX"
    },
    "Informe sua chave": {
        "key": "wallet.enterYourKey",
        "en": "Enter your key",
        "es": "Ingresa tu clave"
    },
    "\n              Taxa de saque: 1% (mínimo R$ 1,00). O valor é bloqueado até processamento.\n            ": {
        "key": "wallet.withdrawalFeeNotice",
        "en": "\n              Withdrawal fee: 1% (minimum R$ 1.00). The amount is blocked until processing.\n            ",
        "es": "\n              Tarifa de retiro: 1% (mínimo R$ 1,00). El monto está bloqueado hasta el procesamiento.\n            "
    },
    " Extrato da carteira": {
        "key": "wallet.walletStatement",
        "en": " Wallet statement",
        "es": " Extracto de la billetera"
    },
    "Sem movimentações ainda.": {
        "key": "wallet.noTransactionsYet",
        "en": "No transactions yet.",
        "es": "Sin movimientos aún."
    },
    " Histórico de saques": {
        "key": "wallet.withdrawalHistory",
        "en": " Withdrawal history",
        "es": " Historial de retiros"
    },
    "Nenhum saque solicitado.": {
        "key": "wallet.noWithdrawalsRequested",
        "en": "No withdrawals requested.",
        "es": "Ningún retiro solicitado."
    },
    "Líquido: ": {
        "key": "wallet.netLabel",
        "en": "Net: ",
        "es": "Líquido: "
    },
    "Solicitado em ": {
        "key": "wallet.requestedOn",
        "en": "Requested on ",
        "es": "Solicitado el "
    },
    "404 Error: User attempted to access non-existent route:": {
        "key": "errors.error404UserAttemptedNonExistentRoute",
        "en": "404 Error: User attempted to access non-existent route:",
        "es": "Error 404: El usuario intentó acceder a una ruta inexistente:"
    },
    "404": {
        "key": "errors.error404",
        "en": "404",
        "es": "404"
    },
    "Página não encontrada": {
        "key": "errors.pageNotFound",
        "en": "Page not found",
        "es": "Página no encontrada"
    },
    "\n          Voltar para o início\n        ": {
        "key": "common.backToHome",
        "en": "\n          Back to home\n        ",
        "es": "\n          Volver al inicio\n        "
    },
    "Confirmação de compra": {
        "key": "notifications.purchaseConfirmation",
        "en": "Purchase confirmation",
        "es": "Confirmación de compra"
    },
    "Receba quando sua compra for confirmada": {
        "key": "notifications.receiveWhenPurchaseConfirmed",
        "en": "Receive when your purchase is confirmed",
        "es": "Recibe cuando tu compra sea confirmada"
    },
    "Lembrete de evento": {
        "key": "notifications.eventReminder",
        "en": "Event reminder",
        "es": "Recordatorio de evento"
    },
    "24h e 1h antes do evento começar": {
        "key": "notifications.eventReminderTiming",
        "en": "24h and 1h before the event starts",
        "es": "24h y 1h antes de que empiece el evento"
    },
    "Promoções e novidades": {
        "key": "notifications.promotionsAndNews",
        "en": "Promotions and news",
        "es": "Promociones y novedades"
    },
    "Descontos e eventos recomendados": {
        "key": "notifications.discountsAndRecommendedEvents",
        "en": "Discounts and recommended events",
        "es": "Descuentos y eventos recomendados"
    },
    "Quando alguém transferir um ingresso para você": {
        "key": "notifications.whenSomeoneTransfersTicket",
        "en": "When someone transfers a ticket to you",
        "es": "Cuando alguien te transfiera una entrada"
    },
    "Atualizações sobre solicitações de reembolso": {
        "key": "notifications.refundRequestUpdates",
        "en": "Updates on refund requests",
        "es": "Actualizaciones sobre solicitudes de reembolso"
    },
    "Todas as notificações foram marcadas como lidas": {
        "key": "notifications.allMarkedAsRead",
        "en": "All notifications have been marked as read",
        "es": "Todas las notificaciones fueron marcadas como leídas"
    },
    "Erro ao marcar notificações": {
        "key": "notifications.errorMarkingNotifications",
        "en": "Error marking notifications",
        "es": "Error al marcar notificaciones"
    },
    "Preferências indisponíveis neste ambiente": {
        "key": "notifications.preferencesUnavailableInEnvironment",
        "en": "Preferences unavailable in this environment",
        "es": "Preferencias no disponibles en este ambiente"
    },
    "Erro ao salvar preferência": {
        "key": "notifications.errorSavingPreference",
        "en": "Error saving preference",
        "es": "Error al guardar preferencia"
    },
    "Preferência atualizada": {
        "key": "notifications.preferenceUpdated",
        "en": "Preference updated",
        "es": "Preferencia actualizada"
    },
    "Ver pedido": {
        "key": "common.viewOrder",
        "en": "View order",
        "es": "Ver pedido"
    },
    "Ver evento": {
        "key": "common.viewEvent",
        "en": "View event",
        "es": "Ver evento"
    },
    "Ver ingressos": {
        "key": "common.viewTickets",
        "en": "View tickets",
        "es": "Ver entradas"
    },
    "Abrir conta": {
        "key": "common.openAccount",
        "en": "Open account",
        "es": "Abrir cuenta"
    },
    "Configure suas preferências de notificação.": {
        "key": "notifications.configurePreferences",
        "en": "Configure your notification preferences.",
        "es": "Configura tus preferencias de notificación."
    },
    " Marcar todas como lidas\n          ": {
        "key": "notifications.markAllAsRead",
        "en": " Mark all as read\n          ",
        "es": " Marcar todas como leídas\n          "
    },
    "\n                Nenhuma notificação por enquanto.\n              ": {
        "key": "notifications.noNotificationsYet",
        "en": "\n                No notifications yet.\n              ",
        "es": "\n                No hay notificaciones por ahora.\n              "
    },
    "\n                            Marcar lida\n                          ": {
        "key": "notifications.markAsRead",
        "en": "\n                            Mark as read\n                          ",
        "es": "\n                            Marcar como leída\n                          "
    },
    "\n              Preferências de canal indisponíveis neste ambiente. Suas notificações continuam funcionando normalmente.\n            ": {
        "key": "notifications.channelPreferencesUnavailable",
        "en": "\n              Channel preferences unavailable in this environment. Your notifications continue to work normally.\n            ",
        "es": "\n              Preferencias de canal no disponibles en este ambiente. Tus notificaciones siguen funcionando normalmente.\n            "
    },
    " Email": {
        "key": "common.emailChannel",
        "en": " Email",
        "es": " Correo"
    },
    " Push": {
        "key": "common.pushChannel",
        "en": " Push",
        "es": " Push"
    },
    " SMS": {
        "key": "common.smsChannel",
        "en": " SMS",
        "es": " SMS"
    },
    "Push": {
        "key": "common.push",
        "en": "Push",
        "es": "Push"
    },
    "SMS": {
        "key": "common.sms",
        "en": "SMS",
        "es": "SMS"
    },
    "Você precisa estar logado para seguir produtores.": {
        "key": "auth.loginRequiredToFollowProducers",
        "en": "You need to be logged in to follow producers.",
        "es": "Necesitas iniciar sesión para seguir productores."
    },
    "Site": {
        "key": "common.website",
        "en": "Website",
        "es": "Sitio"
    },
    "Facebook": {
        "key": "common.facebook",
        "en": "Facebook",
        "es": "Facebook"
    },
    "Organizador não encontrado": {
        "key": "producer.organizerNotFound",
        "en": "Organizer not found",
        "es": "Organizador no encontrado"
    },
    "Não encontramos nenhum organizador com esse perfil.": {
        "key": "producer.noOrganizerWithThisProfile",
        "en": "We couldn't find any organizer with this profile.",
        "es": "No encontramos ningún organizador con este perfil."
    },
    "Nenhum evento": {
        "key": "events.noEvents",
        "en": "No events",
        "es": "Ningún evento"
    },
    "Nenhum evento nesta categoria no momento.": {
        "key": "events.noEventsInCategory",
        "en": "No events in this category at the moment.",
        "es": "No hay eventos en esta categoría por el momento."
    },
    "\n              Fale com o produtor\n            ": {
        "key": "producer.talkToProducer",
        "en": "\n              Talk to the producer\n            ",
        "es": "\n              Hablar con el productor\n            "
    },
    "\n              Disponíveis\n              ": {
        "key": "events.available",
        "en": "\n              Available\n              ",
        "es": "\n              Disponibles\n              "
    },
    "\n              Encerrados\n              ": {
        "key": "events.closed",
        "en": "\n              Closed\n              ",
        "es": "\n              Cerrados\n              "
    },
    "Sobre o produtor": {
        "key": "producer.aboutProducer",
        "en": "About the producer",
        "es": "Sobre el productor"
    },
    "Não foi possível gerar o QR agora": {
        "key": "qrcode.unableToGenerateQRNow",
        "en": "Unable to generate QR code now",
        "es": "No fue posible generar el QR ahora"
    },
    "Cobrança PIX atualizada": {
        "key": "payment.pixChargeUpdated",
        "en": "PIX charge updated",
        "es": "Cobro PIX actualizado"
    },
    "Confira o QR Code abaixo.": {
        "key": "payment.checkQRCodeBelow",
        "en": "Check the QR Code below.",
        "es": "Revisa el Código QR abajo."
    },
    "Erro ao atualizar cobrança PIX": {
        "key": "payment.errorUpdatingPixCharge",
        "en": "Error updating PIX charge",
        "es": "Error al actualizar cobro PIX"
    },
    "Pedido não encontrado.": {
        "key": "orders.orderNotFound",
        "en": "Order not found.",
        "es": "Pedido no encontrado."
    },
    "\n          Ir para Meus Ingressos\n        ": {
        "key": "tickets.goToMyTickets",
        "en": "\n          Go to My Tickets\n        ",
        "es": "\n          Ir a Mis Entradas\n        "
    },
    "Acompanhar Pedido": {
        "key": "orders.trackOrder",
        "en": "Track Order",
        "es": "Seguir Pedido"
    },
    "Acompanhe o status do seu pedido": {
        "key": "orders.trackOrderStatus",
        "en": "Track your order status",
        "es": "Sigue el estado de tu pedido"
    },
    " Meus Ingressos\n        ": {
        "key": "tickets.myTickets",
        "en": " My Tickets\n        ",
        "es": " Mis Entradas\n        "
    },
    "Pedido": {
        "key": "common.order",
        "en": "Order",
        "es": "Pedido"
    },
    " PIX": {
        "key": "payment.pix",
        "en": " PIX",
        "es": " PIX"
    },
    " Cartão": {
        "key": "payment.card",
        "en": " Card",
        "es": " Tarjeta"
    },
    " Boleto": {
        "key": "payment.boleto",
        "en": " Boleto",
        "es": " Boleto"
    },
    "Expira em": {
        "key": "common.expiresIn",
        "en": "Expires in",
        "es": "Expira en"
    },
    "Pague via PIX": {
        "key": "payment.payViaPix",
        "en": "Pay via PIX",
        "es": "Paga vía PIX"
    },
    "Código PIX (copia e cola):": {
        "key": "payment.pixCopyPasteCode",
        "en": "PIX code (copy and paste):",
        "es": "Código PIX (copia y pega):"
    },
    "\n                Aguardando confirmação do pagamento...\n              ": {
        "key": "payment.awaitingPaymentConfirmation",
        "en": "\n                Awaiting payment confirmation...\n              ",
        "es": "\n                Esperando confirmación del pago...\n              "
    },
    "Gerando cobrança PIX": {
        "key": "payment.generatingPixCharge",
        "en": "Generating PIX charge",
        "es": "Generando cobro PIX"
    },
    "\n                Estamos aguardando o gateway retornar seu código PIX. Clique abaixo para atualizar.\n              ": {
        "key": "payment.waitingGatewayPixCode",
        "en": "\n                We are waiting for the gateway to return your PIX code. Click below to update.\n              ",
        "es": "\n                Estamos esperando que la pasarela devuelva tu código PIX. Haz clic abajo para actualizar.\n              "
    },
    "\n                Atualizar QR Code PIX\n              ": {
        "key": "payment.updatePixQRCode",
        "en": "\n                Update PIX QR Code\n              ",
        "es": "\n                Actualizar Código QR PIX\n              "
    },
    "Pague o Boleto": {
        "key": "payment.payBoleto",
        "en": "Pay the Boleto",
        "es": "Paga el Boleto"
    },
    "Código de barras:": {
        "key": "payment.barcode",
        "en": "Barcode:",
        "es": "Código de barras:"
    },
    "\n                    Copiar código\n                  ": {
        "key": "common.copyCode",
        "en": "\n                    Copy code\n                  ",
        "es": "\n                    Copiar código\n                  "
    },
    " Abrir boleto\n                  ": {
        "key": "payment.openBoleto",
        "en": " Open boleto\n                  ",
        "es": " Abrir boleto\n                  "
    },
    "Seus ingressos estão disponíveis.": {
        "key": "tickets.yourTicketsAreAvailable",
        "en": "Your tickets are available.",
        "es": "Tus entradas están disponibles."
    },
    "Pedido expirado": {
        "key": "orders.orderExpired",
        "en": "Order expired",
        "es": "Pedido expirado"
    },
    "O prazo para pagamento expirou. Faça um novo pedido.": {
        "key": "orders.paymentDeadlineExpired",
        "en": "The payment deadline has expired. Place a new order.",
        "es": "El plazo de pago expiró. Haz un nuevo pedido."
    },
    "Ver eventos": {
        "key": "common.viewEvents",
        "en": "View events",
        "es": "Ver eventos"
    },
    "suporte@tickethall.com.br": {
        "key": "support.supportEmail",
        "en": "suporte@tickethall.com.br",
        "es": "suporte@tickethall.com.br"
    },
    "Central de ajuda": {
        "key": "support.helpCenter",
        "en": "Help center",
        "es": "Centro de ayuda"
    },
    "Suporte | TicketHall": {
        "key": "support.supportTicketHall",
        "en": "Support | TicketHall",
        "es": "Soporte | TicketHall"
    },
    "Central de suporte TicketHall": {
        "key": "support.ticketHallSupportCenter",
        "en": "TicketHall Support Center",
        "es": "Centro de Soporte TicketHall"
    },
    "\n            Suporte\n          ": {
        "key": "support.supportNav",
        "en": "\n            Support\n          ",
        "es": "\n            Soporte\n          "
    },
    "Introdução": {
        "key": "privacy.introduction",
        "en": "Introduction",
        "es": "Introducción"
    },
    "Glossário": {
        "key": "privacy.glossary",
        "en": "Glossary",
        "es": "Glosario"
    },
    "Coleta de Dados": {
        "key": "privacy.dataCollection",
        "en": "Data Collection",
        "es": "Recolección de Datos"
    },
    "Finalidade do Tratamento": {
        "key": "privacy.purposeOfProcessing",
        "en": "Purpose of Processing",
        "es": "Finalidad del Tratamiento"
    },
    "Dados e os Produtores": {
        "key": "privacy.dataAndProducers",
        "en": "Data and Producers",
        "es": "Datos y los Productores"
    },
    "Compartilhamento": {
        "key": "privacy.sharing",
        "en": "Sharing",
        "es": "Compartir"
    },
    "Armazenamento e Segurança": {
        "key": "privacy.storageAndSecurity",
        "en": "Storage and Security",
        "es": "Almacenamiento y Seguridad"
    },
    "Transferência Internacional": {
        "key": "privacy.internationalTransfer",
        "en": "International Transfer",
        "es": "Transferencia Internacional"
    },
    "Cookies": {
        "key": "privacy.cookies",
        "en": "Cookies",
        "es": "Cookies"
    },
    "Retenção de Dados": {
        "key": "privacy.dataRetention",
        "en": "Data Retention",
        "es": "Retención de Datos"
    },
    "Direitos do Titular": {
        "key": "privacy.dataSubjectRights",
        "en": "Data Subject Rights",
        "es": "Derechos del Titular"
    },
    "Menores de Idade": {
        "key": "privacy.minors",
        "en": "Minors",
        "es": "Menores de Edad"
    },
    "Alterações desta Política": {
        "key": "privacy.policyChanges",
        "en": "Changes to this Policy",
        "es": "Cambios en esta Política"
    },
    "Contato e DPO": {
        "key": "privacy.contactAndDpo",
        "en": "Contact and DPO",
        "es": "Contacto y DPO"
    },
    "Disposições Gerais": {
        "key": "privacy.generalProvisions",
        "en": "General Provisions",
        "es": "Disposiciones Generales"
    },
    "Política de Privacidade — TicketHall": {
        "key": "privacy.privacyPolicyTitle",
        "en": "Privacy Policy — TicketHall",
        "es": "Política de Privacidad — TicketHall"
    },
    "Entenda como a TicketHall coleta, armazena e utiliza seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).": {
        "key": "privacy.privacyPolicyDescription",
        "en": "Understand how TicketHall collects, stores and uses your personal data in compliance with the LGPD (Law No. 13,709/2018).",
        "es": "Entiende cómo TicketHall recopila, almacena y utiliza tus datos personales en conformidad con la LGPD (Ley nº 13.709/2018)."
    },
    "\n              Documento Legal\n            ": {
        "key": "privacy.legalDocument",
        "en": "\n              Legal Document\n            ",
        "es": "\n              Documento Legal\n            "
    },
    "\n              Política de Privacidade\n            ": {
        "key": "privacy.privacyPolicyNav",
        "en": "\n              Privacy Policy\n            ",
        "es": "\n              Política de Privacidad\n            "
    },
}

# Continuation of MAPPING - entries 142-241
MAPPING.update({
    "\n              A presente Política de Privacidade é baseada nos princípios e valores da TicketHall e tem o objetivo de estabelecer as regras sobre a coleta, o uso, o armazenamento e o compartilhamento dos dados pessoais dos Usuários. Como condição para acesso e utilização da plataforma TicketHall e suas funcionalidades, o Usuário declara que realizou a leitura completa e atenta das regras deste documento, estando plenamente ciente e de acordo com elas em sua versão mais atual.\n            ": {
        "key": "privacy.policyIntroParagraph",
        "en": "\n              This Privacy Policy is based on the principles and values of TicketHall and aims to establish the rules on the collection, use, storage and sharing of Users' personal data. As a condition for accessing and using the TicketHall platform and its features, the User declares that they have read the rules of this document completely and carefully, being fully aware of and in agreement with them in their most current version.\n            ",
        "es": "\n              La presente Política de Privacidad se basa en los principios y valores de TicketHall y tiene el objetivo de establecer las reglas sobre la recolección, el uso, el almacenamiento y el compartir de los datos personales de los Usuarios. Como condición para el acceso y uso de la plataforma TicketHall y sus funcionalidades, el Usuario declara que realizó la lectura completa y atenta de las reglas de este documento, estando plenamente consciente y de acuerdo con ellas en su versión más actual.\n            "
    },
    "\n              Última atualização: 1 de março de 2026\n            ": {
        "key": "privacy.lastUpdated",
        "en": "\n              Last updated: March 1, 2026\n            ",
        "es": "\n              Última actualización: 1 de marzo de 2026\n            "
    },
    "\n                  Sumário\n                ": {
        "key": "privacy.summary",
        "en": "\n                  Summary\n                ",
        "es": "\n                  Sumario\n                "
    },
    "1. Introdução": {
        "key": "privacy.section1Title",
        "en": "1. Introduction",
        "es": "1. Introducción"
    },
    "\n                    1.1. A TicketHall é uma plataforma tecnológica que intermedia a venda de ingressos, inscrições e serviços relacionados a eventos cadastrados por Produtores, acessível pelo site ou por meio de seus aplicativos oficiais. A presente Política de Privacidade descreve como os dados pessoais dos Usuários são coletados, utilizados, armazenados e compartilhados, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.\n                  ": {
        "key": "privacy.section1_1",
        "en": "\n                    1.1. TicketHall is a technological platform that intermediates the sale of tickets, registrations and services related to events registered by Producers, accessible via the website or through its official applications. This Privacy Policy describes how Users' personal data is collected, used, stored and shared, in compliance with the General Personal Data Protection Law (LGPD — Law No. 13,709/2018) and other applicable legislation.\n                  ",
        "es": "\n                    1.1. TicketHall es una plataforma tecnológica que intermedia la venta de entradas, inscripciones y servicios relacionados con eventos registrados por Productores, accesible por el sitio web o mediante sus aplicaciones oficiales. La presente Política de Privacidad describe cómo se recopilan, utilizan, almacenan y comparten los datos personales de los Usuarios, en conformidad con la Ley General de Protección de Datos Personales (LGPD — Ley nº 13.709/2018) y demás legislaciones aplicables.\n                  "
    },
    "\n                    1.2. Esta Política se aplica a todos os Usuários da plataforma TicketHall, sejam eles Compradores, Produtores, Participantes ou pessoas que tão somente acessem a plataforma. Ao comprar e/ou utilizar um ingresso, cadastrar um evento ou navegar pela plataforma, os Usuários declaram estar expressamente de acordo com as informações aqui descritas.\n                  ": {
        "key": "privacy.section1_2",
        "en": "\n                    1.2. This Policy applies to all Users of the TicketHall platform, whether they are Buyers, Producers, Participants or people who merely access the platform. By purchasing and/or using a ticket, registering an event or browsing the platform, Users declare that they expressly agree with the information described here.\n                  ",
        "es": "\n                    1.2. Esta Política se aplica a todos los Usuarios de la plataforma TicketHall, sean Compradores, Productores, Participantes o personas que tan solo accedan a la plataforma. Al comprar y/o utilizar una entrada, registrar un evento o navegar por la plataforma, los Usuarios declaran estar expresamente de acuerdo con la información aquí descrita.\n                  "
    },
    "\n                    1.3. A depender da atuação do Usuário na plataforma, algumas condições específicas podem ser aplicadas, conforme se demonstrará ao longo deste documento.\n                  ": {
        "key": "privacy.section1_3",
        "en": "\n                    1.3. Depending on the User's activity on the platform, some specific conditions may apply, as will be demonstrated throughout this document.\n                  ",
        "es": "\n                    1.3. Dependiendo de la actuación del Usuario en la plataforma, pueden aplicarse algunas condiciones específicas, como se demostrará a lo largo de este documento.\n                  "
    },
    "\n                    1.4. Durante a utilização da plataforma TicketHall, os dados pessoais dos Usuários poderão ser coletados em diferentes momentos, como ao criar uma conta, adquirir ingressos ou se inscrever em um evento. Para cada tipo de informação coletada, existe um nível de proteção adequado que a TicketHall adota, assim como diferentes tipos de utilização.\n                  ": {
        "key": "privacy.section1_4",
        "en": "\n                    1.4. During the use of the TicketHall platform, Users' personal data may be collected at different times, such as when creating an account, purchasing tickets or registering for an event. For each type of information collected, there is an appropriate level of protection that TicketHall adopts, as well as different types of use.\n                  ",
        "es": "\n                    1.4. Durante la utilización de la plataforma TicketHall, los datos personales de los Usuarios podrán ser recopilados en diferentes momentos, como al crear una cuenta, adquirir entradas o inscribirse en un evento. Para cada tipo de información recopilada, existe un nivel de protección adecuado que TicketHall adopta, así como diferentes tipos de utilización.\n                  "
    },
    "2. Glossário": {
        "key": "privacy.section2Title",
        "en": "2. Glossary",
        "es": "2. Glosario"
    },
    "\n                    Para os fins desta Política de Privacidade, consideram-se as seguintes definições:\n                  ": {
        "key": "privacy.section2Intro",
        "en": "\n                    For the purposes of this Privacy Policy, the following definitions are considered:\n                  ",
        "es": "\n                    Para los fines de esta Política de Privacidad, se consideran las siguientes definiciones:\n                  "
    },
    "3. Coleta de Dados Pessoais e Não Pessoais": {
        "key": "privacy.section3Title",
        "en": "3. Collection of Personal and Non-Personal Data",
        "es": "3. Recolección de Datos Personales y No Personales"
    },
    "\n                    3.1. Durante a utilização da plataforma TicketHall, os dados pessoais dos Usuários poderão ser coletados em diferentes momentos, como ao criar uma conta, adquirir ingressos, cadastrar eventos ou navegar pela plataforma. Para cada tipo de dado coletado, a TicketHall adota um nível de proteção adequado, de acordo com sua natureza e sensibilidade.\n                  ": {
        "key": "privacy.section3_1",
        "en": "\n                    3.1. During the use of the TicketHall platform, Users' personal data may be collected at different times, such as when creating an account, purchasing tickets, registering events or browsing the platform. For each type of data collected, TicketHall adopts an appropriate level of protection, according to its nature and sensitivity.\n                  ",
        "es": "\n                    3.1. Durante la utilización de la plataforma TicketHall, los datos personales de los Usuarios podrán ser recopilados en diferentes momentos, como al crear una cuenta, adquirir entradas, registrar eventos o navegar por la plataforma. Para cada tipo de dato recopilado, TicketHall adopta un nivel de protección adecuado, de acuerdo con su naturaleza y sensibilidad.\n                  "
    },
    "\n                    3.2. A TicketHall poderá coletar as seguintes categorias de dados pessoais:\n                  ": {
        "key": "privacy.section3_2",
        "en": "\n                    3.2. TicketHall may collect the following categories of personal data:\n                  ",
        "es": "\n                    3.2. TicketHall podrá recopilar las siguientes categorías de datos personales:\n                  "
    },
    "\n                    3.3. A TicketHall também poderá coletar dados não pessoais, tais como informações agregadas de uso da plataforma, estatísticas de navegação e dados técnicos de desempenho, que não permitem a identificação direta do Usuário. Na medida em que o endereço IP ou identificadores semelhantes sejam considerados dados pessoais pela legislação aplicável, a TicketHall tratará esses identificadores como dados pessoais.\n                  ": {
        "key": "privacy.section3_3",
        "en": "\n                    3.3. TicketHall may also collect non-personal data, such as aggregated platform usage information, browsing statistics and technical performance data, which do not allow direct identification of the User. To the extent that IP addresses or similar identifiers are considered personal data by applicable legislation, TicketHall will treat such identifiers as personal data.\n                  ",
        "es": "\n                    3.3. TicketHall también podrá recopilar datos no personales, tales como información agregada de uso de la plataforma, estadísticas de navegación y datos técnicos de desempeño, que no permiten la identificación directa del Usuario. En la medida en que las direcciones IP o identificadores similares sean considerados datos personales por la legislación aplicable, TicketHall tratará esos identificadores como datos personales.\n                  "
    },
    "\n                    3.4. A TicketHall poderá obter dados pessoais diretamente do Usuário, por meio de formulários, interações com a plataforma e comunicações diretas, ou ainda de fontes públicas e parceiros autorizados, sempre em conformidade com a legislação vigente.\n                  ": {
        "key": "privacy.section3_4",
        "en": "\n                    3.4. TicketHall may obtain personal data directly from the User, through forms, interactions with the platform and direct communications, or from public sources and authorized partners, always in compliance with current legislation.\n                  ",
        "es": "\n                    3.4. TicketHall podrá obtener datos personales directamente del Usuario, por medio de formularios, interacciones con la plataforma y comunicaciones directas, o aún de fuentes públicas y socios autorizados, siempre en conformidad con la legislación vigente.\n                  "
    },
    "\n                    3.5. O Usuário é integralmente responsável por fornecer informações exatas, verdadeiras e atualizadas. O fornecimento de informações falsas, incorretas ou imprecisas poderá resultar na suspensão ou encerramento da conta e na impossibilidade de utilização dos serviços da plataforma, sem qualquer ônus para a TicketHall.\n                  ": {
        "key": "privacy.section3_5",
        "en": "\n                    3.5. The User is fully responsible for providing accurate, true and updated information. The provision of false, incorrect or inaccurate information may result in the suspension or termination of the account and the inability to use the platform's services, without any liability for TicketHall.\n                  ",
        "es": "\n                    3.5. El Usuario es integralmente responsable de proporcionar información exacta, verdadera y actualizada. El suministro de información falsa, incorrecta o imprecisa podrá resultar en la suspensión o cierre de la cuenta y en la imposibilidad de utilizar los servicios de la plataforma, sin ninguna responsabilidad para TicketHall.\n                  "
    },
    "4. Finalidade do Tratamento de Dados": {
        "key": "privacy.section4Title",
        "en": "4. Purpose of Data Processing",
        "es": "4. Finalidad del Tratamiento de Datos"
    },
    "\n                    4.1. A TicketHall utiliza os dados pessoais coletados para as seguintes finalidades:\n                  ": {
        "key": "privacy.section4_1",
        "en": "\n                    4.1. TicketHall uses the personal data collected for the following purposes:\n                  ",
        "es": "\n                    4.1. TicketHall utiliza los datos personales recopilados para las siguientes finalidades:\n                  "
    },
    "\n                    4.2. As bases legais utilizadas para o tratamento de dados pessoais, conforme a LGPD, incluem: (i) execução de contrato ou de procedimentos preliminares; (ii) cumprimento de obrigação legal ou regulatória; (iii) consentimento do titular; (iv) legítimo interesse do controlador ou de terceiros; (v) exercício regular de direitos em processo judicial, administrativo ou arbitral; (vi) proteção ao crédito.\n                  ": {
        "key": "privacy.section4_2",
        "en": "\n                    4.2. The legal bases used for the processing of personal data, according to the LGPD, include: (i) execution of a contract or preliminary procedures; (ii) compliance with a legal or regulatory obligation; (iii) consent of the data subject; (iv) legitimate interest of the controller or third parties; (v) regular exercise of rights in judicial, administrative or arbitral proceedings; (vi) credit protection.\n                  ",
        "es": "\n                    4.2. Las bases legales utilizadas para el tratamiento de datos personales, conforme a la LGPD, incluyen: (i) ejecución de contrato o de procedimientos preliminares; (ii) cumplimiento de obligación legal o regulatoria; (iii) consentimiento del titular; (iv) interés legítimo del controlador o de terceros; (v) ejercicio regular de derechos en proceso judicial, administrativo o arbitral; (vi) protección al crédito.\n                  "
    },
    "\n                    4.3. A TicketHall não utilizará os dados pessoais dos Usuários para finalidades incompatíveis com as aqui descritas, exceto mediante consentimento específico do titular ou quando houver base legal que assim permita.\n                  ": {
        "key": "privacy.section4_3",
        "en": "\n                    4.3. TicketHall will not use Users' personal data for purposes incompatible with those described here, except with the specific consent of the data subject or when there is a legal basis that allows it.\n                  ",
        "es": "\n                    4.3. TicketHall no utilizará los datos personales de los Usuarios para finalidades incompatibles con las aquí descritas, salvo mediante consentimiento específico del titular o cuando haya base legal que así lo permita.\n                  "
    },
    "5. Utilização dos Dados Pessoais pelos Produtores": {
        "key": "privacy.section5Title",
        "en": "5. Use of Personal Data by Producers",
        "es": "5. Utilización de los Datos Personales por los Productores"
    },
    "\n                    5.1. O Produtor, na condição de Controlador de dados pessoais, fica ciente de que somente poderá realizar o tratamento dos dados pessoais dos Compradores e Participantes em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados) e demais legislações, nacionais e internacionais, aplicáveis.\n                  ": {
        "key": "privacy.section5_1",
        "en": "\n                    5.1. The Producer, as Controller of personal data, is aware that they may only process the personal data of Buyers and Participants in compliance with Law No. 13,709/2018 (General Data Protection Law) and other applicable national and international legislation.\n                  ",
        "es": "\n                    5.1. El Productor, en condición de Controlador de datos personales, queda en conocimiento de que solo podrá realizar el tratamiento de los datos personales de los Compradores y Participantes en conformidad con la Ley nº 13.709/2018 (Ley General de Protección de Datos) y demás legislaciones, nacionales e internacionales, aplicables.\n                  "
    },
    "\n                    5.2. A TicketHall, na condição de Operadora de dados pessoais, realizará o tratamento desses dados em nome dos Produtores quando, por exemplo: (i) coletar e armazenar dados pessoais de Compradores para prestação dos serviços de gestão de eventos e venda de ingressos; (ii) disponibilizar para os Produtores ferramenta para envio de comunicações aos Compradores e outros Usuários; (iii) fornecer relatórios de eventos para análise dos Produtores.\n                  ": {
        "key": "privacy.section5_2",
        "en": "\n                    5.2. TicketHall, as Operator of personal data, will process such data on behalf of Producers when, for example: (i) collecting and storing Buyers' personal data for the provision of event management and ticket sales services; (ii) making available to Producers a tool for sending communications to Buyers and other Users; (iii) providing event reports for Producers' analysis.\n                  ",
        "es": "\n                    5.2. TicketHall, en condición de Operadora de datos personales, realizará el tratamiento de esos datos en nombre de los Productores cuando, por ejemplo: (i) recopilar y almacenar datos personales de Compradores para la prestación de los servicios de gestión de eventos y venta de entradas; (ii) disponibilizar para los Productores herramienta para envío de comunicaciones a los Compradores y otros Usuarios; (iii) suministrar reportes de eventos para análisis de los Productores.\n                  "
    },
    "\n                    5.3. O Produtor reconhece que, no exercício de suas atividades de tratamento, será integral e exclusivamente responsável, tanto perante a TicketHall quanto perante os titulares dos dados pessoais tratados, em caso de descumprimento da legislação aplicável. O Produtor deve ser diligente ao coletar dados pessoais, compartilhar dados com terceiros (como patrocinadores de eventos, fornecedores, etc.) ou armazenar tais dados em sua própria infraestrutura tecnológica ou de terceiros.\n                  ": {
        "key": "privacy.section5_3",
        "en": "\n                    5.3. The Producer acknowledges that, in the exercise of their processing activities, they will be fully and exclusively liable, both to TicketHall and to the data subjects whose personal data is processed, in case of non-compliance with applicable legislation. The Producer must be diligent when collecting personal data, sharing data with third parties (such as event sponsors, suppliers, etc.) or storing such data in their own or third-party technological infrastructure.\n                  ",
        "es": "\n                    5.3. El Productor reconoce que, en el ejercicio de sus actividades de tratamiento, será integral y exclusivamente responsable, tanto frente a TicketHall como frente a los titulares de los datos personales tratados, en caso de incumplimiento de la legislación aplicable. El Productor debe ser diligente al recopilar datos personales, compartir datos con terceros (como patrocinadores de eventos, proveedores, etc.) o almacenar tales datos en su propia infraestructura tecnológica o de terceros.\n                  "
    },
    "\n                    5.4. Os dados pessoais compartilhados com o Produtor são limitados ao estritamente necessário para a gestão do evento, incluindo nome do Participante, endereço de e-mail e dados de check-in. O Produtor não está autorizado a utilizar tais dados para finalidades diversas das relacionadas ao evento, salvo mediante consentimento expresso do titular.\n                  ": {
        "key": "privacy.section5_4",
        "en": "\n                    5.4. The personal data shared with the Producer is limited to what is strictly necessary for event management, including the Participant's name, email address and check-in data. The Producer is not authorized to use such data for purposes other than those related to the event, except with the express consent of the data subject.\n                  ",
        "es": "\n                    5.4. Los datos personales compartidos con el Productor están limitados a lo estrictamente necesario para la gestión del evento, incluyendo nombre del Participante, dirección de correo electrónico y datos de check-in. El Productor no está autorizado a utilizar tales datos para finalidades distintas de las relacionadas con el evento, salvo mediante consentimiento expreso del titular.\n                  "
    },
    "\n                    5.5. Caso a TicketHall seja questionada, administrativa ou judicialmente, sobre a legalidade de qualquer atividade de tratamento de dados pessoais realizada pelo Produtor, caberá a este imediatamente: (a) identificar-se como exclusivo responsável pela atividade questionada; (b) tomar toda e qualquer medida ao seu alcance para excluir a TicketHall do questionamento; e (c) isentar a TicketHall de qualquer responsabilidade neste sentido.\n                  ": {
        "key": "privacy.section5_5",
        "en": "\n                    5.5. If TicketHall is questioned, administratively or judicially, about the legality of any personal data processing activity carried out by the Producer, the Producer must immediately: (a) identify themselves as the sole responsible party for the questioned activity; (b) take all measures within their reach to exclude TicketHall from the questioning; and (c) release TicketHall from any liability in this regard.\n                  ",
        "es": "\n                    5.5. En caso de que TicketHall sea cuestionada, administrativa o judicialmente, sobre la legalidad de cualquier actividad de tratamiento de datos personales realizada por el Productor, cabrá a este inmediatamente: (a) identificarse como exclusivo responsable por la actividad cuestionada; (b) tomar toda y cualquier medida a su alcance para excluir a TicketHall del cuestionamiento; y (c) eximir a TicketHall de cualquier responsabilidad en este sentido.\n                  "
    },
    "\n                    5.6. O Produtor será integral e exclusivamente responsável por atender às solicitações dos titulares dos dados pessoais tratados, referentes a: (i) confirmação da existência de tratamento; (ii) acesso aos dados; (iii) correção de dados incompletos, inexatos ou desatualizados; (iv) anonimização, bloqueio ou eliminação de dados desnecessários; (v) portabilidade dos dados; (vi) informação sobre a possibilidade de não fornecer consentimento e as respectivas consequências; e (vii) revogação do consentimento.\n                  ": {
        "key": "privacy.section5_6",
        "en": "\n                    5.6. The Producer will be fully and exclusively responsible for responding to requests from the data subjects whose personal data is processed, regarding: (i) confirmation of the existence of processing; (ii) access to data; (iii) correction of incomplete, inaccurate or outdated data; (iv) anonymization, blocking or deletion of unnecessary data; (v) data portability; (vi) information about the possibility of not providing consent and the respective consequences; and (vii) revocation of consent.\n                  ",
        "es": "\n                    5.6. El Productor será integral y exclusivamente responsable de atender las solicitudes de los titulares de los datos personales tratados, referentes a: (i) confirmación de la existencia de tratamiento; (ii) acceso a los datos; (iii) corrección de datos incompletos, inexactos o desactualizados; (iv) anonimización, bloqueo o eliminación de datos innecesarios; (v) portabilidad de los datos; (vi) información sobre la posibilidad de no proporcionar consentimiento y las respectivas consecuencias; y (vii) revocación del consentimiento.\n                  "
    },
    "6. Compartilhamento de Dados Pessoais": {
        "key": "privacy.section6Title",
        "en": "6. Sharing of Personal Data",
        "es": "6. Compartir de Datos Personales"
    },
    "\n                    6.1. Os dados pessoais dos Usuários poderão ser compartilhados com terceiros nas seguintes hipóteses:\n                  ": {
        "key": "privacy.section6_1",
        "en": "\n                    6.1. Users' personal data may be shared with third parties in the following cases:\n                  ",
        "es": "\n                    6.1. Los datos personales de los Usuarios podrán ser compartidos con terceros en las siguientes hipótesis:\n                  "
    },
    "\n                    6.2. A TicketHall não vende, comercializa ou disponibiliza dados pessoais a terceiros para fins de marketing, publicidade ou qualquer outra finalidade que não esteja descrita nesta Política. Qualquer compartilhamento será realizado dentro dos limites previstos na LGPD e exclusivamente para as finalidades aqui estabelecidas.\n                  ": {
        "key": "privacy.section6_2",
        "en": "\n                    6.2. TicketHall does not sell, market or make personal data available to third parties for marketing, advertising or any other purpose not described in this Policy. Any sharing will be carried out within the limits provided for in the LGPD and exclusively for the purposes established herein.\n                  ",
        "es": "\n                    6.2. TicketHall no vende, comercializa ni pone a disposición datos personales a terceros para fines de marketing, publicidad o cualquier otra finalidad que no esté descrita en esta Política. Cualquier compartir se realizará dentro de los límites previstos en la LGPD y exclusivamente para las finalidades aquí establecidas.\n                  "
    },
    "\n                    6.3. Em todos os casos de compartilhamento, a TicketHall exige o cumprimento das mesmas garantias de segurança e privacidade que adota internamente, incluindo obrigações contratuais de confidencialidade e conformidade com a legislação de proteção de dados.\n                  ": {
        "key": "privacy.section6_3",
        "en": "\n                    6.3. In all cases of sharing, TicketHall requires compliance with the same security and privacy guarantees that it adopts internally, including contractual obligations of confidentiality and compliance with data protection legislation.\n                  ",
        "es": "\n                    6.3. En todos los casos de compartir, TicketHall exige el cumplimiento de las mismas garantías de seguridad y privacidad que adopta internamente, incluyendo obligaciones contractuales de confidencialidad y conformidad con la legislación de protección de datos.\n                  "
    },
    "7. Armazenamento e Segurança dos Dados": {
        "key": "privacy.section7Title",
        "en": "7. Data Storage and Security",
        "es": "7. Almacenamiento y Seguridad de los Datos"
    },
    "\n                    7.1. Os dados pessoais são armazenados em servidores seguros, com criptografia em trânsito (TLS/SSL) e em repouso. A TicketHall implementa medidas técnicas e organizacionais robustas para proteger os dados contra acesso não autorizado, perda, alteração, destruição ou qualquer forma de tratamento inadequado ou ilícito.\n                  ": {
        "key": "privacy.section7_1",
        "en": "\n                    7.1. Personal data is stored on secure servers, with encryption in transit (TLS/SSL) and at rest. TicketHall implements robust technical and organizational measures to protect data against unauthorized access, loss, alteration, destruction or any form of improper or unlawful processing.\n                  ",
        "es": "\n                    7.1. Los datos personales se almacenan en servidores seguros, con cifrado en tránsito (TLS/SSL) y en reposo. TicketHall implementa medidas técnicas y organizativas robustas para proteger los datos contra acceso no autorizado, pérdida, alteración, destrucción o cualquier forma de tratamiento inadecuado o ilícito.\n                  "
    },
    "\n                    7.2. As medidas de segurança incluem, mas não se limitam a: criptografia de dados sensíveis, firewalls, controles de acesso baseados em função, monitoramento contínuo de ameaças, testes de segurança periódicos, políticas internas de proteção de dados e treinamento de equipe.\n                  ": {
        "key": "privacy.section7_2",
        "en": "\n                    7.2. Security measures include, but are not limited to: encryption of sensitive data, firewalls, role-based access controls, continuous threat monitoring, periodic security testing, internal data protection policies and team training.\n                  ",
        "es": "\n                    7.2. Las medidas de seguridad incluyen, pero no se limitan a: cifrado de datos sensibles, firewalls, controles de acceso basados en funciones, monitoreo continuo de amenazas, pruebas de seguridad periódicas, políticas internas de protección de datos y capacitación del equipo.\n                  "
    },
    "\n                    7.3. A TicketHall garante que qualquer pessoa, física ou jurídica, contratada ou autorizada a realizar o tratamento de dados pessoais em seu nome (sub-processadores), estará sujeita a obrigações legais e de confidencialidade em relação a tais dados.\n                  ": {
        "key": "privacy.section7_3",
        "en": "\n                    7.3. TicketHall guarantees that any individual or legal entity, contracted or authorized to process personal data on its behalf (sub-processors), will be subject to legal and confidentiality obligations regarding such data.\n                  ",
        "es": "\n                    7.3. TicketHall garantiza que cualquier persona, física o jurídica, contratada o autorizada para realizar el tratamiento de datos personales en su nombre (sub-procesadores), estará sujeta a obligaciones legales y de confidencialidad en relación con tales datos.\n                  "
    },
    "\n                    7.4. Embora a TicketHall adote as melhores práticas de segurança da informação, não é possível garantir completamente a não ocorrência de interceptações e violações dos sistemas e bases de dados, uma vez que a internet possui sua estrutura de segurança em permanente aperfeiçoamento.\n                  ": {
        "key": "privacy.section7_4",
        "en": "\n                    7.4. Although TicketHall adopts the best information security practices, it is not possible to completely guarantee the non-occurrence of interceptions and breaches of systems and databases, since the internet has its security structure in permanent improvement.\n                  ",
        "es": "\n                    7.4. Aunque TicketHall adopta las mejores prácticas de seguridad de la información, no es posible garantizar completamente la no ocurrencia de interceptaciones y violaciones de los sistemas y bases de datos, ya que internet posee su estructura de seguridad en permanente perfeccionamiento.\n                  "
    },
    "\n                    7.5. Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a TicketHall comunicará os Usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD) nos prazos e condições previstos na legislação vigente, adotando as medidas cabíveis para mitigar os efeitos do incidente.\n                  ": {
        "key": "privacy.section7_5",
        "en": "\n                    7.5. In the event of a security incident that may entail relevant risk or damage to data subjects, TicketHall will notify the affected Users and the National Data Protection Authority (ANPD) within the timeframes and conditions provided for in current legislation, adopting appropriate measures to mitigate the effects of the incident.\n                  ",
        "es": "\n                    7.5. En caso de incidente de seguridad que pueda acarrear riesgo o daño relevante a los titulares, TicketHall comunicará a los Usuarios afectados y a la Autoridad Nacional de Protección de Datos (ANPD) en los plazos y condiciones previstos en la legislación vigente, adoptando las medidas cabibles para mitigar los efectos del incidente.\n                  "
    },
    "8. Transferência Internacional de Dados": {
        "key": "privacy.section8Title",
        "en": "8. International Data Transfer",
        "es": "8. Transferencia Internacional de Datos"
    },
    "\n                    8.1. Os dados pessoais dos Usuários poderão ser armazenados em servidores localizados fora do Brasil, em países que ofereçam nível adequado de proteção de dados pessoais ou mediante a adoção de garantias apropriadas, conforme previsto nos artigos 33 a 36 da LGPD.\n                  ": {
        "key": "privacy.section8_1",
        "en": "\n                    8.1. Users' personal data may be stored on servers located outside Brazil, in countries that offer an adequate level of personal data protection or through the adoption of appropriate guarantees, as provided for in articles 33 to 36 of the LGPD.\n                  ",
        "es": "\n                    8.1. Los datos personales de los Usuarios podrán ser almacenados en servidores ubicados fuera de Brasil, en países que ofrezcan nivel adecuado de protección de datos personales o mediante la adopción de garantías apropiadas, conforme previsto en los artículos 33 a 36 de la LGPD.\n                  "
    },
    "\n                    8.2. A TicketHall utiliza serviços de computação em nuvem de provedores reconhecidos internacionalmente, que adotam padrões de segurança e privacidade compatíveis com a legislação brasileira e regulamentações internacionais, incluindo, mas não se limitando a, provedores localizados nos Estados Unidos da América (EUA) e em países da União Europeia.\n                  ": {
        "key": "privacy.section8_2",
        "en": "\n                    8.2. TicketHall uses cloud computing services from internationally recognized providers that adopt security and privacy standards compatible with Brazilian legislation and international regulations, including, but not limited to, providers located in the United States of America (USA) and in countries of the European Union.\n                  ",
        "es": "\n                    8.2. TicketHall utiliza servicios de computación en la nube de proveedores reconocidos internacionalmente, que adoptan estándares de seguridad y privacidad compatibles con la legislación brasileña y regulaciones internacionales, incluyendo, pero no limitándose a, proveedores ubicados en los Estados Unidos de América (EE.UU.) y en países de la Unión Europea.\n                  "
    },
    "\n                    8.3. Em todos os casos de transferência internacional de dados, a TicketHall exigirá o cumprimento das mesmas garantias de segurança e privacidade que adota internamente, assegurando que os dados pessoais dos Usuários sejam protegidos de forma adequada independentemente da localização dos servidores.\n                  ": {
        "key": "privacy.section8_3",
        "en": "\n                    8.3. In all cases of international data transfer, TicketHall will require compliance with the same security and privacy guarantees that it adopts internally, ensuring that Users' personal data is adequately protected regardless of the location of the servers.\n                  ",
        "es": "\n                    8.3. En todos los casos de transferencia internacional de datos, TicketHall exigirá el cumplimiento de las mismas garantías de seguridad y privacidad que adopta internamente, asegurando que los datos personales de los Usuarios sean protegidos de forma adecuada independientemente de la ubicación de los servidores.\n                  "
    },
    "9. Cookies e Tecnologias de Rastreamento": {
        "key": "privacy.section9Title",
        "en": "9. Cookies and Tracking Technologies",
        "es": "9. Cookies y Tecnologías de Rastreo"
    },
    "\n                    9.1. A TicketHall utiliza tecnologias de rastreamento como cookies, pixel tags, armazenamento local e outros identificadores, de dispositivos móveis ou não, para uma variedade de funções. Essas tecnologias ajudam a autenticar a conta do Usuário, promover e aperfeiçoar os serviços, personalizar a experiência e avaliar a eficácia das comunicações.\n                  ": {
        "key": "privacy.section9_1",
        "en": "\n                    9.1. TicketHall uses tracking technologies such as cookies, pixel tags, local storage and other identifiers, from mobile or non-mobile devices, for a variety of functions. These technologies help authenticate the User's account, promote and improve services, personalize the experience and evaluate the effectiveness of communications.\n                  ",
        "es": "\n                    9.1. TicketHall utiliza tecnologías de rastreo como cookies, pixel tags, almacenamiento local y otros identificadores, de dispositivos móviles o no, para una variedad de funciones. Estas tecnologías ayudan a autenticar la cuenta del Usuario, promover y perfeccionar los servicios, personalizar la experiencia y evaluar la eficacia de las comunicaciones.\n                  "
    },
    "\n                    9.2. Cookies são arquivos que contêm um identificador (uma sequência de letras e números) enviados por um servidor para determinado navegador, que o armazena. Os cookies podem ser \"persistentes\" (armazenados até sua data de validade ou exclusão pelo Usuário) ou \"de sessão\" (expiram ao final de uma sessão de navegação).\n                  ": {
        "key": "privacy.section9_2",
        "en": "\n                    9.2. Cookies are files that contain an identifier (a sequence of letters and numbers) sent by a server to a given browser, which stores it. Cookies can be \"persistent\" (stored until their expiration date or deletion by the User) or \"session\" (expire at the end of a browsing session).\n                  ",
        "es": "\n                    9.2. Las cookies son archivos que contienen un identificador (una secuencia de letras y números) enviados por un servidor a un determinado navegador, que lo almacena. Las cookies pueden ser \"persistentes\" (almacenadas hasta su fecha de validez o eliminación por el Usuario) o \"de sesión\" (expiran al final de una sesión de navegación).\n                  "
    },
    "\n                    9.3. A TicketHall poderá utilizar as seguintes categorias de cookies:\n                  ": {
        "key": "privacy.section9_3",
        "en": "\n                    9.3. TicketHall may use the following categories of cookies:\n                  ",
        "es": "\n                    9.3. TicketHall podrá utilizar las siguientes categorías de cookies:\n                  "
    },
    "\n                    9.4. O Usuário poderá gerenciar suas preferências de cookies por meio do banner apresentado durante o acesso à plataforma, podendo optar por desabilitar uma ou mais categorias, com exceção dos cookies estritamente necessários. O Usuário também poderá gerenciar suas preferências a partir das configurações de seu navegador ou dispositivo, recusando ou excluindo determinados cookies.\n                  ": {
        "key": "privacy.section9_4",
        "en": "\n                    9.4. The User may manage their cookie preferences through the banner presented during access to the platform, being able to choose to disable one or more categories, with the exception of strictly necessary cookies. The User may also manage their preferences from their browser or device settings, refusing or deleting certain cookies.\n                  ",
        "es": "\n                    9.4. El Usuario podrá gestionar sus preferencias de cookies por medio del banner presentado durante el acceso a la plataforma, pudiendo optar por deshabilitar una o más categorías, con excepción de las cookies estrictamente necesarias. El Usuario también podrá gestionar sus preferencias a partir de las configuraciones de su navegador o dispositivo, rechazando o eliminando determinadas cookies.\n                  "
    },
    "\n                    9.5. A desativação de determinados cookies poderá comprometer a prestação dos serviços ou impedir o funcionamento de determinadas funcionalidades da plataforma.\n                  ": {
        "key": "privacy.section9_5",
        "en": "\n                    9.5. Disabling certain cookies may compromise the provision of services or prevent the functioning of certain platform features.\n                  ",
        "es": "\n                    9.5. La desactivación de determinadas cookies podría comprometer la prestación de los servicios o impedir el funcionamiento de determinadas funcionalidades de la plataforma.\n                  "
    },
    "\n                    9.6. Os provedores de serviços terceiros utilizados pela TicketHall poderão utilizar cookies e outras tecnologias de sua propriedade para identificar o navegador e dispositivo utilizados, de modo a oferecer publicidade direcionada quando o Usuário acessa websites ou aplicativos de terceiros. A TicketHall não possui controle sobre esses cookies de terceiros.\n                  ": {
        "key": "privacy.section9_6",
        "en": "\n                    9.6. Third-party service providers used by TicketHall may use cookies and other technologies of their own to identify the browser and device used, in order to offer targeted advertising when the User accesses third-party websites or applications. TicketHall has no control over these third-party cookies.\n                  ",
        "es": "\n                    9.6. Los proveedores de servicios de terceros utilizados por TicketHall podrán utilizar cookies y otras tecnologías de su propiedad para identificar el navegador y dispositivo utilizados, a fin de ofrecer publicidad dirigida cuando el Usuario accede a sitios web o aplicaciones de terceros. TicketHall no posee control sobre esas cookies de terceros.\n                  "
    },
    "\n                    9.7. A TicketHall poderá utilizar outras tecnologias de rastreamento, como web beacons (pixel tags) e URLs click-through, para avaliar a eficácia de comunicações e campanhas, e para compreender o interesse em determinados conteúdos e eventos.\n                  ": {
        "key": "privacy.section9_7",
        "en": "\n                    9.7. TicketHall may use other tracking technologies, such as web beacons (pixel tags) and click-through URLs, to evaluate the effectiveness of communications and campaigns, and to understand interest in certain content and events.\n                  ",
        "es": "\n                    9.7. TicketHall podrá utilizar otras tecnologías de rastreo, como web beacons (pixel tags) y URLs click-through, para evaluar la eficacia de las comunicaciones y campañas, y para comprender el interés en determinados contenidos y eventos.\n                  "
    },
    "10. Retenção de Dados": {
        "key": "privacy.section10Title",
        "en": "10. Data Retention",
        "es": "10. Retención de Datos"
    },
    "\n                    10.1. A TicketHall manterá os dados pessoais dos Usuários pelo período necessário para cumprir as finalidades descritas nesta Política ou conforme exigido pela legislação aplicável. Os prazos de retenção consideram as seguintes diretrizes:\n                  ": {
        "key": "privacy.section10_1",
        "en": "\n                    10.1. TicketHall will retain Users' personal data for the period necessary to fulfill the purposes described in this Policy or as required by applicable legislation. Retention periods consider the following guidelines:\n                  ",
        "es": "\n                    10.1. TicketHall mantendrá los datos personales de los Usuarios por el período necesario para cumplir las finalidades descritas en esta Política o conforme exigido por la legislación aplicable. Los plazos de retención consideran las siguientes directrices:\n                  "
    },
    "\n                    10.2. Após o término do período de retenção, os dados pessoais serão excluídos ou anonimizados, salvo quando houver necessidade legal, regulatória ou contratual para sua manutenção, ou quando forem necessários para o exercício regular de direitos em processos judiciais, administrativos ou arbitrais.\n                  ": {
        "key": "privacy.section10_2",
        "en": "\n                    10.2. After the retention period ends, personal data will be deleted or anonymized, except when there is a legal, regulatory or contractual need for its maintenance, or when they are necessary for the regular exercise of rights in judicial, administrative or arbitral proceedings.\n                  ",
        "es": "\n                    10.2. Después de la finalización del período de retención, los datos personales serán eliminados o anonimizados, salvo cuando haya necesidad legal, regulatoria o contractual para su mantenimiento, o cuando sean necesarios para el ejercicio regular de derechos en procesos judiciales, administrativos o arbitrales.\n                  "
    },
    "11. Direitos do Titular dos Dados": {
        "key": "privacy.section11Title",
        "en": "11. Data Subject Rights",
        "es": "11. Derechos del Titular de los Datos"
    },
    "\n                    11.1. Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o Usuário, na qualidade de titular de dados pessoais, tem os seguintes direitos em relação aos seus dados:\n                  ": {
        "key": "privacy.section11_1",
        "en": "\n                    11.1. According to the General Data Protection Law (Law No. 13,709/2018), the User, as a personal data subject, has the following rights regarding their data:\n                  ",
        "es": "\n                    11.1. Conforme a la Ley General de Protección de Datos (Ley nº 13.709/2018), el Usuario, en calidad de titular de datos personales, tiene los siguientes derechos en relación con sus datos:\n                  "
    },
    "\n                    11.2. Para exercer seus direitos, o Usuário poderá acessar a seção de privacidade em sua conta na plataforma ou enviar solicitação para o endereço de e-mail": {
        "key": "privacy.section11_2",
        "en": "\n                    11.2. To exercise their rights, the User may access the privacy section in their account on the platform or send a request to the email address",
        "es": "\n                    11.2. Para ejercer sus derechos, el Usuario podrá acceder a la sección de privacidad en su cuenta en la plataforma o enviar una solicitud a la dirección de correo electrónico"
    },
    "privacidade@tickethall.com.br": {
        "key": "privacy.privacyEmail",
        "en": "privacidade@tickethall.com.br",
        "es": "privacidade@tickethall.com.br"
    },
    ".\n                    A TicketHall responderá às solicitações em até 15 (quinze) dias úteis, conforme previsto na legislação.\n                  ": {
        "key": "privacy.section11_2_suffix",
        "en": ".\n                    TicketHall will respond to requests within 15 (fifteen) business days, as provided by law.\n                  ",
        "es": ".\n                    TicketHall responderá a las solicitudes en hasta 15 (quince) días hábiles, conforme previsto en la legislación.\n                  "
    },
    "\n                    11.3. A exclusão ou anonimização de dados poderá ser limitada quando o armazenamento for necessário para: (i) cumprimento de obrigação legal ou regulatória; (ii) execução de contrato; (iii) exercício regular de direitos em processos judiciais, administrativos ou arbitrais; (iv) proteção ao crédito; ou (v) atendimento a interesse legítimo do controlador.\n                  ": {
        "key": "privacy.section11_3",
        "en": "\n                    11.3. Data deletion or anonymization may be limited when storage is necessary for: (i) compliance with a legal or regulatory obligation; (ii) execution of a contract; (iii) regular exercise of rights in judicial, administrative or arbitral proceedings; (iv) credit protection; or (v) attending to the legitimate interest of the controller.\n                  ",
        "es": "\n                    11.3. La eliminación o anonimización de datos podrá ser limitada cuando el almacenamiento sea necesario para: (i) cumplimiento de obligación legal o regulatoria; (ii) ejecución de contrato; (iii) ejercicio regular de derechos en procesos judiciales, administrativos o arbitrales; (iv) protección al crédito; o (v) atención a interés legítimo del controlador.\n                  "
    },
    "12. Menores de Idade": {
        "key": "privacy.section12Title",
        "en": "12. Minors",
        "es": "12. Menores de Edad"
    },
    "\n                    12.1. Os serviços da plataforma TicketHall são direcionados para pessoas maiores de 18 (dezoito) anos, com documento pessoal e endereço de e-mail válidos. Menores de 18 (dezoito) anos somente poderão utilizar a plataforma desde que devidamente autorizados ou assistidos por seus responsáveis ou representantes legais, em conformidade com o Estatuto da Criança e do Adolescente (Lei nº 8.069/1990) e com a LGPD.\n                  ": {
        "key": "privacy.section12_1",
        "en": "\n                    12.1. The services of the TicketHall platform are intended for people over 18 (eighteen) years of age, with a valid personal document and email address. Minors under 18 (eighteen) years of age may only use the platform if duly authorized or assisted by their guardians or legal representatives, in accordance with the Child and Adolescent Statute (Law No. 8,069/1990) and the LGPD.\n                  ",
        "es": "\n                    12.1. Los servicios de la plataforma TicketHall están dirigidos a personas mayores de 18 (dieciocho) años, con documento personal y dirección de correo electrónico válidos. Los menores de 18 (dieciocho) años solo podrán utilizar la plataforma siempre que estén debidamente autorizados o asistidos por sus responsables o representantes legales, en conformidad con el Estatuto del Niño y del Adolescente (Ley nº 8.069/1990) y con la LGPD.\n                  "
    },
    "\n                    12.2. A TicketHall não coleta intencionalmente dados pessoais de menores de 13 (treze) anos. Caso seja identificado que dados de menores de 13 anos foram coletados sem o consentimento dos responsáveis legais, a TicketHall adotará as medidas necessárias para a imediata exclusão desses dados.\n                  ": {
        "key": "privacy.section12_2",
        "en": "\n                    12.2. TicketHall does not intentionally collect personal data from children under 13 (thirteen) years of age. If it is identified that data from children under 13 years of age has been collected without the consent of legal guardians, TicketHall will take the necessary measures for the immediate deletion of such data.\n                  ",
        "es": "\n                    12.2. TicketHall no recopila intencionalmente datos personales de menores de 13 (trece) años. En caso de identificarse que datos de menores de 13 años fueron recopilados sin el consentimiento de los responsables legales, TicketHall adoptará las medidas necesarias para la inmediata eliminación de esos datos.\n                  "
    },
    "\n                    12.3. É de responsabilidade exclusiva dos responsáveis ou representantes legais o monitoramento da navegação e utilização da plataforma por parte de menores de idade.\n                  ": {
        "key": "privacy.section12_3",
        "en": "\n                    12.3. It is the exclusive responsibility of guardians or legal representatives to monitor the browsing and use of the platform by minors.\n                  ",
        "es": "\n                    12.3. Es responsabilidad exclusiva de los responsables o representantes legales el monitoreo de la navegación y utilización de la plataforma por parte de menores de edad.\n                  "
    },
    "13. Alterações desta Política": {
        "key": "privacy.section13Title",
        "en": "13. Changes to this Policy",
        "es": "13. Cambios en esta Política"
    },
    "\n                    13.1. A presente Política de Privacidade está sujeita a constante melhoria e aprimoramento. A TicketHall se reserva o direito de modificá-la a qualquer momento, conforme a finalidade da plataforma, para adequação e conformidade legal de disposição de lei ou norma que tenha força jurídica equivalente.\n                  ": {
        "key": "privacy.section13_1",
        "en": "\n                    13.1. This Privacy Policy is subject to constant improvement. TicketHall reserves the right to modify it at any time, according to the purpose of the platform, for adaptation and legal compliance with any law or regulation of equivalent legal force.\n                  ",
        "es": "\n                    13.1. La presente Política de Privacidad está sujeta a constante mejora y perfeccionamiento. TicketHall se reserva el derecho de modificarla en cualquier momento, conforme a la finalidad de la plataforma, para adecuación y conformidad legal de disposición de ley o norma que tenga fuerza jurídica equivalente.\n                  "
    },
    "\n                    13.2. A TicketHall notificará os Usuários sobre mudanças significativas nesta Política por meio de e-mail, notificação na plataforma ou publicação em destaque no site. Recomenda-se que os Usuários revisem periodicamente a versão mais atual.\n                  ": {
        "key": "privacy.section13_2",
        "en": "\n                    13.2. TicketHall will notify Users about significant changes to this Policy via email, platform notification or highlighted publication on the website. It is recommended that Users periodically review the most current version.\n                  ",
        "es": "\n                    13.2. TicketHall notificará a los Usuarios sobre cambios significativos en esta Política por medio de correo electrónico, notificación en la plataforma o publicación destacada en el sitio web. Se recomienda que los Usuarios revisen periódicamente la versión más actual.\n                  "
    },
    "\n                    13.3. Ao continuar utilizando a plataforma após a publicação de alterações nesta Política, o Usuário declara estar ciente e de acordo com as modificações realizadas.\n                  ": {
        "key": "privacy.section13_3",
        "en": "\n                    13.3. By continuing to use the platform after the publication of changes to this Policy, the User declares that they are aware of and agree with the modifications made.\n                  ",
        "es": "\n                    13.3. Al continuar utilizando la plataforma después de la publicación de cambios en esta Política, el Usuario declara estar consciente y de acuerdo con las modificaciones realizadas.\n                  "
    },
    "14. Contato e Encarregado de Proteção de Dados (DPO)": {
        "key": "privacy.section14Title",
        "en": "14. Contact and Data Protection Officer (DPO)",
        "es": "14. Contacto y Encargado de Protección de Datos (DPO)"
    },
    "\n                    14.1. Para dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento de dados pessoais, o Usuário poderá entrar em contato com o Encarregado de Proteção de Dados (DPO) da TicketHall pelo endereço de e-mail": {
        "key": "privacy.section14_1",
        "en": "\n                    14.1. For questions, requests or complaints about this Privacy Policy or about the processing of personal data, the User may contact the Data Protection Officer (DPO) of TicketHall at the email address",
        "es": "\n                    14.1. Para dudas, solicitudes o reclamos sobre esta Política de Privacidad o sobre el tratamiento de datos personales, el Usuario podrá ponerse en contacto con el Encargado de Protección de Datos (DPO) de TicketHall por la dirección de correo electrónico"
    },
    "\n                    14.2. A comunicação entre a TicketHall e o Usuário sobre assuntos de privacidade e proteção de dados deverá ser realizada pelos canais oficiais de atendimento disponibilizados na plataforma.\n                  ": {
        "key": "privacy.section14_2",
        "en": "\n                    14.2. Communication between TicketHall and the User on matters of privacy and data protection must be carried out through the official service channels made available on the platform.\n                  ",
        "es": "\n                    14.2. La comunicación entre TicketHall y el Usuario sobre asuntos de privacidad y protección de datos deberá realizarse por los canales oficiales de atención disponibilizados en la plataforma.\n                  "
    },
    "15. Disposições Gerais": {
        "key": "privacy.section15Title",
        "en": "15. General Provisions",
        "es": "15. Disposiciones Generales"
    },
    "\n                    15.1. A TicketHall somente será obrigada a disponibilizar registros de acesso, informações pessoais ou comunicações privadas armazenadas em sua plataforma mediante ordem judicial ou requisição de autoridade policial ou administrativa competente, nos termos do Marco Civil da Internet (Lei nº 12.965/2014) e da LGPD.\n                  ": {
        "key": "privacy.section15_1",
        "en": "\n                    15.1. TicketHall will only be obliged to provide access records, personal information or private communications stored on its platform by court order or request from a competent police or administrative authority, under the terms of the Brazilian Civil Rights Framework for the Internet (Law No. 12,965/2014) and the LGPD.\n                  ",
        "es": "\n                    15.1. TicketHall solo estará obligada a disponibilizar registros de acceso, información personal o comunicaciones privadas almacenadas en su plataforma mediante orden judicial o requisición de autoridad policial o administrativa competente, a los términos del Marco Civil de Internet (Ley nº 12.965/2014) y de la LGPD.\n                  "
    },
    "\n                    15.2. A eventual tolerância quanto a qualquer violação dos termos e condições desta Política será considerada mera liberalidade e não será interpretada como novação, precedente invocável, renúncia a direitos, alteração tácita dos termos, direito adquirido ou alteração contratual.\n                  ": {
        "key": "privacy.section15_2",
        "en": "\n                    15.2. Any tolerance regarding any violation of the terms and conditions of this Policy shall be considered mere liberality and shall not be interpreted as novation, invocable precedent, waiver of rights, tacit amendment of terms, acquired right or contractual amendment.\n                  ",
        "es": "\n                    15.2. La eventual tolerancia respecto a cualquier violación de los términos y condiciones de esta Política será considerada mera liberalidad y no será interpretada como novación, precedente invocable, renuncia a derechos, alteración tácita de los términos, derecho adquirido o alteración contractual.\n                  "
    },
    "\n                    15.3. Caso alguma disposição desta Política for julgada inaplicável ou sem efeito, o restante das normas continuará a viger, sem a necessidade de medida judicial que declare tal assertiva. Os termos aqui descritos serão interpretados segundo a legislação brasileira.\n                  ": {
        "key": "privacy.section15_3",
        "en": "\n                    15.3. If any provision of this Policy is deemed inapplicable or without effect, the remaining rules shall continue in force, without the need for a judicial measure declaring such assertion. The terms described herein shall be interpreted according to Brazilian law.\n                  ",
        "es": "\n                    15.3. En caso de que alguna disposición de esta Política sea juzgada inaplicable o sin efecto, el resto de las normas continuará vigente, sin la necesidad de medida judicial que declare tal aseveración. Los términos aquí descritos serán interpretados según la legislación brasileña.\n                  "
    },
    "\n                    15.4. O Usuário assume total responsabilidade por todos os prejuízos, diretos e indiretos, inclusive indenização, lucros cessantes, honorários advocatícios e demais encargos judiciais e extrajudiciais que a TicketHall seja obrigada a incorrer em virtude de ato ou omissão do Usuário que resulte em violação desta Política.\n                  ": {
        "key": "privacy.section15_4",
        "en": "\n                    15.4. The User assumes full responsibility for all damages, direct and indirect, including compensation, lost profits, attorneys' fees and other judicial and extrajudicial charges that TicketHall is obliged to incur as a result of an act or omission by the User that results in a violation of this Policy.\n                  ",
        "es": "\n                    15.4. El Usuario asume total responsabilidad por todos los perjuicios, directos e indirectos, incluyendo indemnización, lucros cesantes, honorarios de abogados y demás cargos judiciales y extrajudiciales que TicketHall sea obligada a incurrir en virtud de acto u omisión del Usuario que resulte en violación de esta Política.\n                  "
    },
    "\n                    15.5. Fica eleito o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias ou queixas oriundas da utilização da plataforma ou relacionadas a esta Política de Privacidade, com renúncia expressa a qualquer outro, por mais privilegiado que seja.\n                  ": {
        "key": "privacy.section15_5",
        "en": "\n                    15.5. The court of the District of São Paulo, State of São Paulo, is hereby elected to settle any controversies or complaints arising from the use of the platform or related to this Privacy Policy, with express waiver of any other, however privileged it may be.\n                  ",
        "es": "\n                    15.5. Queda elegido el foro de la Comarca de São Paulo, Estado de São Paulo, para dirimir cualesquiera controversias o quejas originadas de la utilización de la plataforma o relacionadas con esta Política de Privacidad, con renuncia expresa a cualquier otro, por más privilegiado que sea.\n                  "
    },
    "Aceite dos termos de uso da plataforma.": {
        "key": "terms.acceptTermsOfUse",
        "en": "Acceptance of the platform terms of use.",
        "es": "Aceptación de los términos de uso de la plataforma."
    },
    "Processamento de Dados": {
        "key": "privacy.dataProcessing",
        "en": "Data Processing",
        "es": "Procesamiento de Datos"
    },
    "Consentimento para processamento de dados pessoais conforme a LGPD.": {
        "key": "privacy.consentForDataProcessing",
        "en": "Consent for processing of personal data in accordance with the LGPD.",
        "es": "Consentimiento para el procesamiento de datos personales conforme a la LGPD."
    },
    "Comunicações de Marketing": {
        "key": "marketing.marketingCommunications",
        "en": "Marketing Communications",
        "es": "Comunicaciones de Marketing"
    },
    "Receber emails promocionais e novidades sobre eventos.": {
        "key": "marketing.receivePromotionalEmails",
        "en": "Receive promotional emails and news about events.",
        "es": "Recibir correos promocionales y novedades sobre eventos."
    },
    "Dados exportados!": {
        "key": "privacy.dataExported",
        "en": "Data exported!",
        "es": "¡Datos exportados!"
    },
    "O download começou automaticamente.": {
        "key": "privacy.downloadStartedAutomatically",
        "en": "The download started automatically.",
        "es": "La descarga comenzó automáticamente."
    },
    "Erro ao exportar": {
        "key": "privacy.errorExporting",
        "en": "Error exporting",
        "es": "Error al exportar"
    },
    "Solicitação registrada": {
        "key": "privacy.requestRegistered",
        "en": "Request registered",
        "es": "Solicitud registrada"
    },
    "Privacidade e Dados": {
        "key": "privacy.privacyAndData",
        "en": "Privacy and Data",
        "es": "Privacidad y Datos"
    },
    "Gerencie seus dados e privacidade na TicketHall.": {
        "key": "privacy.managePrivacyDescription",
        "en": "Manage your data and privacy on TicketHall.",
        "es": "Gestiona tus datos y privacidad en TicketHall."
    },
    "Consentimentos": {
        "key": "privacy.consents",
        "en": "Consents",
        "es": "Consentimientos"
    },
    "Gerencie seus consentimentos conforme a LGPD (Lei Geral de Proteção de Dados).": {
        "key": "privacy.manageConsentsDescription",
        "en": "Manage your consents in accordance with the LGPD (General Data Protection Law).",
        "es": "Gestiona tus consentimientos conforme a la LGPD (Ley General de Protección de Datos)."
    },
    "Exportar Meus Dados": {
        "key": "privacy.exportMyData",
        "en": "Export My Data",
        "es": "Exportar Mis Datos"
    },
    "Baixe uma cópia de todos os seus dados pessoais armazenados na plataforma (perfil, pedidos, ingressos, consentimentos).": {
        "key": "privacy.exportDataDescription",
        "en": "Download a copy of all your personal data stored on the platform (profile, orders, tickets, consents).",
        "es": "Descarga una copia de todos tus datos personales almacenados en la plataforma (perfil, pedidos, entradas, consentimientos)."
    },
    "Excluir Conta": {
        "key": "profile.deleteAccount",
        "en": "Delete Account",
        "es": "Eliminar Cuenta"
    },
    "\n              Solicite a exclusão permanente da sua conta e todos os dados associados.\n              Esta ação é irreversível e será processada em até 15 dias úteis.\n            ": {
        "key": "profile.deleteAccountDescription",
        "en": "\n              Request the permanent deletion of your account and all associated data.\n              This action is irreversible and will be processed within up to 15 business days.\n            ",
        "es": "\n              Solicita la eliminación permanente de tu cuenta y todos los datos asociados.\n              Esta acción es irreversible y será procesada en hasta 15 días hábiles.\n            "
    },
    "\n                Solicitação de exclusão em andamento.\n              ": {
        "key": "profile.deletionRequestInProgress",
        "en": "\n                Account deletion request in progress.\n              ",
        "es": "\n                Solicitud de eliminación en curso.\n              "
    },
    " Solicitar exclusão\n                  ": {
        "key": "profile.requestDeletion",
        "en": " Request deletion\n                  ",
        "es": " Solicitar eliminación\n                  "
    },
    "Tem certeza?": {
        "key": "common.areYouSure",
        "en": "Are you sure?",
        "es": "¿Estás seguro?"
    },
    "\n                      Ao confirmar, sua conta e todos os dados serão permanentemente excluídos em até 15 dias.\n                      Ingressos ativos serão cancelados e não poderão ser recuperados.\n                    ": {
        "key": "profile.confirmDeletionWarning",
        "en": "\n                      Upon confirmation, your account and all data will be permanently deleted within up to 15 days.\n                      Active tickets will be canceled and cannot be recovered.\n                    ",
        "es": "\n                      Al confirmar, tu cuenta y todos los datos serán permanentemente eliminados en hasta 15 días.\n                      Las entradas activas serán canceladas y no podrán ser recuperadas.\n                    "
    },
    "\n                      Confirmar exclusão\n                    ": {
        "key": "profile.confirmDeletion",
        "en": "\n                      Confirm deletion\n                    ",
        "es": "\n                      Confirmar eliminación\n                    "
    },
    "Histórico de Solicitações": {
        "key": "profile.requestHistory",
        "en": "Request History",
        "es": "Historial de Solicitudes"
    },
    "Conta a pagar criada!": {
        "key": "cashflow.accountPayableCreated",
        "en": "Account payable created!",
        "es": "¡Cuenta por pagar creada!"
    },
    "Removido!": {
        "key": "common.removed",
        "en": "Removed!",
        "es": "¡Removido!"
    },
    "Despesa atualizada!": {
        "key": "cashflow.expenseUpdated",
        "en": "Expense updated!",
        "es": "¡Gasto actualizado!"
    },
    "Editar despesa": {
        "key": "cashflow.editExpense",
        "en": "Edit expense",
        "es": "Editar gasto"
    },
    "Confirmar pagamento": {
        "key": "cashflow.confirmPayment",
        "en": "Confirm payment",
        "es": "Confirmar pago"
    },
    "Categoria invalida": {
        "key": "cashflow.invalidCategory",
        "en": "Invalid category",
        "es": "Categoría inválida"
    },
    "Categoria adicionada!": {
        "key": "cashflow.categoryAdded",
        "en": "Category added!",
        "es": "¡Categoría agregada!"
    },
    "Nao foi possivel remover": {
        "key": "cashflow.couldNotRemove",
        "en": "Could not remove",
        "es": "No fue posible remover"
    },
    "Categoria removida!": {
        "key": "cashflow.categoryRemoved",
        "en": "Category removed!",
        "es": "¡Categoría removida!"
    },
    "Confirmado": {
        "key": "cashflow.confirmed",
        "en": "Confirmed",
        "es": "Confirmado"
    },
    "Total: ": {
        "key": "common.totalLabel",
        "en": "Total: ",
        "es": "Total: "
    },
    " Nova despesa": {
        "key": "cashflow.newExpense",
        "en": " New expense",
        "es": " Nuevo gasto"
    },
    "Nova conta a pagar": {
        "key": "cashflow.newAccountPayable",
        "en": "New account payable",
        "es": "Nueva cuenta por pagar"
    },
    "Registre uma despesa ou comissão a pagar.": {
        "key": "cashflow.registerExpenseDescription",
        "en": "Record an expense or commission to pay.",
        "es": "Registra un gasto o comisión por pagar."
    },
    "Ex: Comissão promoter João": {
        "key": "cashflow.expenseExample",
        "en": "Ex: Promoter commission John",
        "es": "Ej: Comisión promoter João"
    },
    "Valor (R$)": {
        "key": "forms.amountBRL",
        "en": "Amount (R$)",
        "es": "Valor (R$)"
    },
    "Data de vencimento": {
        "key": "forms.dueDate",
        "en": "Due date",
        "es": "Fecha de vencimiento"
    },
    "Observações": {
        "key": "forms.notes",
        "en": "Notes",
        "es": "Observaciones"
    },
    "Atualize os dados da conta a pagar.": {
        "key": "cashflow.updatePayableDescription",
        "en": "Update the account payable data.",
        "es": "Actualiza los datos de la cuenta por pagar."
    },
    "Categorias de contas a pagar": {
        "key": "cashflow.payableCategories",
        "en": "Accounts payable categories",
        "es": "Categorías de cuentas por pagar"
    },
    "Adicione ou remova categorias para usar nas despesas.": {
        "key": "cashflow.manageExpenseCategoriesDescription",
        "en": "Add or remove categories to use in expenses.",
        "es": "Agrega o remueve categorías para usar en gastos."
    },
    "Ex: Fornecedor, Marketing, Estrutura": {
        "key": "cashflow.categoryExample",
        "en": "Ex: Supplier, Marketing, Infrastructure",
        "es": "Ej: Proveedor, Marketing, Infraestructura"
    },
    "Adicionar": {
        "key": "common.add",
        "en": "Add",
        "es": "Agregar"
    },
    "Conta a receber criada!": {
        "key": "cashflow.accountReceivableCreated",
        "en": "Account receivable created!",
        "es": "¡Cuenta por cobrar creada!"
    },
    "Recebimento confirmado!": {
        "key": "cashflow.receiptConfirmed",
        "en": "Receipt confirmed!",
        "es": "¡Cobro confirmado!"
    },
    "Confirmar recebimento": {
        "key": "cashflow.confirmReceipt",
        "en": "Confirm receipt",
        "es": "Confirmar cobro"
    },
    "Recebido": {
        "key": "cashflow.received",
        "en": "Received",
        "es": "Recibido"
    },
    " Nova entrada": {
        "key": "cashflow.newEntry",
        "en": " New entry",
        "es": " Nueva entrada"
    },
    "Nova conta a receber": {
        "key": "cashflow.newAccountReceivable",
        "en": "New account receivable",
        "es": "Nueva cuenta por cobrar"
    },
    "Registre uma receita esperada.": {
        "key": "cashflow.registerRevenueDescription",
        "en": "Record an expected revenue.",
        "es": "Registra un ingreso esperado."
    },
    "Ex: Venda de ingressos Lote 1": {
        "key": "cashflow.revenueExample",
        "en": "Ex: Ticket sales Batch 1",
        "es": "Ej: Venta de entradas Lote 1"
    },
    "Categorias de contas a receber": {
        "key": "cashflow.receivableCategories",
        "en": "Accounts receivable categories",
        "es": "Categorías de cuentas por cobrar"
    },
    "Adicione ou remova categorias para usar nas receitas.": {
        "key": "cashflow.manageRevenueCategoriesDescription",
        "en": "Add or remove categories to use in revenues.",
        "es": "Agrega o remueve categorías para usar en ingresos."
    },
    "Ex: Patrocinio, Bilheteria externa": {
        "key": "cashflow.revenueCategoryExample",
        "en": "Ex: Sponsorship, External box office",
        "es": "Ej: Patrocinio, Boletería externa"
    },
    "Conta adicionada!": {
        "key": "bankAccounts.accountAdded",
        "en": "Account added!",
        "es": "¡Cuenta agregada!"
    },
    "Conta padrão atualizada!": {
        "key": "bankAccounts.defaultAccountUpdated",
        "en": "Default account updated!",
        "es": "¡Cuenta predeterminada actualizada!"
    },
    "Conta removida!": {
        "key": "bankAccounts.accountRemoved",
        "en": "Account removed!",
        "es": "¡Cuenta removida!"
    },
    "Suas contas bancárias": {
        "key": "bankAccounts.yourBankAccounts",
        "en": "Your bank accounts",
        "es": "Tus cuentas bancarias"
    },
    " Nova conta": {
        "key": "bankAccounts.newAccount",
        "en": " New account",
        "es": " Nueva cuenta"
    },
    "Nenhuma conta bancária cadastrada.": {
        "key": "bankAccounts.noBankAccountsRegistered",
        "en": "No bank accounts registered.",
        "es": "Ninguna cuenta bancaria registrada."
    },
    "Padrão": {
        "key": "bankAccounts.defaultLabel",
        "en": "Default",
        "es": "Predeterminada"
    },
    "Banco: ": {
        "key": "bankAccounts.bankLabel",
        "en": "Bank: ",
        "es": "Banco: "
    },
    "Agência: ": {
        "key": "bankAccounts.agencyLabel",
        "en": "Branch: ",
        "es": "Agencia: "
    },
    " | Conta: ": {
        "key": "bankAccounts.accountSeparator",
        "en": " | Account: ",
        "es": " | Cuenta: "
    },
    "PIX (": {
        "key": "bankAccounts.pixPrefix",
        "en": "PIX (",
        "es": "PIX ("
    },
    "Definir como padrão": {
        "key": "bankAccounts.setAsDefault",
        "en": "Set as default",
        "es": "Definir como predeterminada"
    },
    "Nova conta bancária": {
        "key": "bankAccounts.newBankAccount",
        "en": "New bank account",
        "es": "Nueva cuenta bancaria"
    },
    "Adicione uma conta para recebimento.": {
        "key": "bankAccounts.addAccountForReceipt",
        "en": "Add an account for receiving payments.",
        "es": "Agrega una cuenta para recibir pagos."
    },
    "Nome da conta": {
        "key": "bankAccounts.accountName",
        "en": "Account name",
        "es": "Nombre de la cuenta"
    },
    "Ex: Conta PJ Itaú": {
        "key": "bankAccounts.accountNameExample",
        "en": "Ex: Business Account Itaú",
        "es": "Ej: Cuenta PJ Itaú"
    },
    "Banco": {
        "key": "bankAccounts.bank",
        "en": "Bank",
        "es": "Banco"
    },
    "Itaú": {
        "key": "bankAccounts.itau",
        "en": "Itaú",
        "es": "Itaú"
    },
    "Agência": {
        "key": "bankAccounts.branch",
        "en": "Branch",
        "es": "Agencia"
    },
    "Número da conta": {
        "key": "bankAccounts.accountNumber",
        "en": "Account number",
        "es": "Número de cuenta"
    },
    "Tipo PIX": {
        "key": "bankAccounts.pixType",
        "en": "PIX type",
        "es": "Tipo PIX"
    },
    "CPF/CNPJ": {
        "key": "common.taxId",
        "en": "Tax ID",
        "es": "Documento"
    },
    "Saldo Líquido": {
        "key": "cashflow.netBalance",
        "en": "Net Balance",
        "es": "Saldo Líquido"
    },
    "Total a Receber": {
        "key": "cashflow.totalReceivable",
        "en": "Total Receivable",
        "es": "Total por Cobrar"
    },
    "Total a Pagar": {
        "key": "cashflow.totalPayable",
        "en": "Total Payable",
        "es": "Total por Pagar"
    },
    "Resumo do Fluxo de Caixa": {
        "key": "cashflow.cashFlowSummary",
        "en": "Cash Flow Summary",
        "es": "Resumen del Flujo de Caja"
    },
    "Receitas confirmadas": {
        "key": "cashflow.confirmedRevenues",
        "en": "Confirmed revenues",
        "es": "Ingresos confirmados"
    },
    "Receitas pendentes": {
        "key": "cashflow.pendingRevenues",
        "en": "Pending revenues",
        "es": "Ingresos pendientes"
    },
    "Despesas confirmadas": {
        "key": "cashflow.confirmedExpenses",
        "en": "Confirmed expenses",
        "es": "Gastos confirmados"
    },
    "Despesas pendentes": {
        "key": "cashflow.pendingExpenses",
        "en": "Pending expenses",
        "es": "Gastos pendientes"
    },
    "Saldo projetado": {
        "key": "cashflow.projectedBalance",
        "en": "Projected balance",
        "es": "Saldo proyectado"
    },
    "Faturamento total": {
        "key": "dashboard.totalRevenue",
        "en": "Total revenue",
        "es": "Facturación total"
    },
    "Pedidos pagos": {
        "key": "dashboard.paidOrders",
        "en": "Paid orders",
        "es": "Pedidos pagados"
    },
    "Eventos ativos": {
        "key": "dashboard.activeEvents",
        "en": "Active events",
        "es": "Eventos activos"
    },
    "Vendas nos últimos 7 dias": {
        "key": "dashboard.salesLast7Days",
        "en": "Sales in the last 7 days",
        "es": "Ventas en los últimos 7 días"
    },
    "Painel do produtor": {
        "key": "dashboard.producerDashboard",
        "en": "Producer dashboard",
        "es": "Panel del productor"
    },
    "Decisões rápidas do seu evento principal": {
        "key": "dashboard.mainEventQuickDecisions",
        "en": "Quick decisions for your main event",
        "es": "Decisiones rápidas de tu evento principal"
    },
    "\n                Veja o que precisa de ação agora e ajuste o evento em foco sem perder tempo.\n              ": {
        "key": "dashboard.mainEventQuickDecisionsDescription",
        "en": "\n                See what needs action now and adjust the focused event without wasting time.\n              ",
        "es": "\n                Ve lo que necesita acción ahora y ajusta el evento en foco sin perder tiempo.\n              "
    },
    "\n                  Ver financeiro ": {
        "key": "dashboard.viewFinancial",
        "en": "\n                  View financial ",
        "es": "\n                  Ver financiero "
    },
    "\n                  Ver eventos ": {
        "key": "dashboard.viewEvents",
        "en": "\n                  View events ",
        "es": "\n                  Ver eventos "
    },
    " Criar evento\n                ": {
        "key": "dashboard.createEvent",
        "en": " Create event\n                ",
        "es": " Crear evento\n                "
    },
    "Não foi possível carregar os dados": {
        "key": "common.unableToLoadData",
        "en": "Unable to load data",
        "es": "No fue posible cargar los datos"
    },
    "Tente novamente ou confira o console para detalhes técnicos.": {
        "key": "common.tryAgainOrCheckConsole",
        "en": "Try again or check the console for technical details.",
        "es": "Intenta de nuevo o revisa la consola para detalles técnicos."
    },
    "\n                Recarregar dados\n              ": {
        "key": "common.reloadData",
        "en": "\n                Reload data\n              ",
        "es": "\n                Recargar datos\n              "
    },
    "Evento em foco": {
        "key": "dashboard.eventInFocus",
        "en": "Event in focus",
        "es": "Evento en foco"
    },
    "Resumo do evento principal que merece sua atenção agora.": {
        "key": "dashboard.mainEventSummaryDescription",
        "en": "Summary of the main event that deserves your attention now.",
        "es": "Resumen del evento principal que merece tu atención ahora."
    },
    "Faturamento": {
        "key": "dashboard.revenue",
        "en": "Revenue",
        "es": "Facturación"
    },
    "Ingressos vendidos": {
        "key": "dashboard.ticketsSold",
        "en": "Tickets sold",
        "es": "Entradas vendidas"
    },
    "Dias para o evento": {
        "key": "dashboard.daysToEvent",
        "en": "Days to event",
        "es": "Días para el evento"
    },
    "Pedidos pagos (7 dias)": {
        "key": "dashboard.paidOrders7Days",
        "en": "Paid orders (7 days)",
        "es": "Pedidos pagados (7 días)"
    },
    "Capacidade usada": {
        "key": "dashboard.capacityUsed",
        "en": "Capacity used",
        "es": "Capacidad usada"
    },
    " Editar evento\n                    ": {
        "key": "dashboard.editEvent",
        "en": " Edit event\n                    ",
        "es": " Editar evento\n                    "
    },
    "\n                      Abrir painel completo ": {
        "key": "dashboard.openFullPanel",
        "en": "\n                      Open full panel ",
        "es": "\n                      Abrir panel completo "
    },
    "Nenhum evento para acompanhar agora": {
        "key": "dashboard.noEventToTrackNow",
        "en": "No event to track right now",
        "es": "Ningún evento para seguir ahora"
    },
    "Crie um evento para começar a ver indicadores práticos.": {
        "key": "dashboard.createEventToSeeIndicators",
        "en": "Create an event to start seeing practical indicators.",
        "es": "Crea un evento para empezar a ver indicadores prácticos."
    },
    " Criar evento\n                  ": {
        "key": "dashboard.createEventAlt",
        "en": " Create event\n                  ",
        "es": " Crear evento\n                  "
    },
    "Alertas práticos": {
        "key": "dashboard.practicalAlerts",
        "en": "Practical alerts",
        "es": "Alertas prácticas"
    },
    "Problema e ação recomendada, sem rodeios.": {
        "key": "dashboard.practicalAlertsDescription",
        "en": "Problem and recommended action, no fuss.",
        "es": "Problema y acción recomendada, sin rodeos."
    },
    "\n                      Resolver prioridade principal ": {
        "key": "dashboard.resolveMainPriority",
        "en": "\n                      Resolve main priority ",
        "es": "\n                      Resolver prioridad principal "
    },
    "Contexto rápido para o que vem depois do evento principal.": {
        "key": "dashboard.quickContextAfterMainEvent",
        "en": "Quick context for what comes after the main event.",
        "es": "Contexto rápido para lo que viene después del evento principal."
    },
    "\n                          Abrir ": {
        "key": "dashboard.open",
        "en": "\n                          Open ",
        "es": "\n                          Abrir "
    },
    "Nenhum outro evento na fila": {
        "key": "dashboard.noOtherEventInQueue",
        "en": "No other event in queue",
        "es": "Ningún otro evento en fila"
    },
    "Quando houver novos eventos, eles aparecem aqui.": {
        "key": "dashboard.newEventsWillAppearHere",
        "en": "When there are new events, they will appear here.",
        "es": "Cuando haya nuevos eventos, aparecerán aquí."
    },
    "Resumo financeiro": {
        "key": "dashboard.financialSummary",
        "en": "Financial summary",
        "es": "Resumen financiero"
    },
    "Visão consolidada da sua operação atual.": {
        "key": "dashboard.financialSummaryDescription",
        "en": "Consolidated view of your current operation.",
        "es": "Visión consolidada de tu operación actual."
    },
    "Eventos cadastrados": {
        "key": "dashboard.registeredEvents",
        "en": "Registered events",
        "es": "Eventos registrados"
    },
    "Eventos futuros": {
        "key": "dashboard.upcomingEvents",
        "en": "Upcoming events",
        "es": "Eventos futuros"
    },
    "Check-in realizado!": {
        "key": "checkin.checkinSuccessful",
        "en": "Check-in successful!",
        "es": "¡Check-in realizado!"
    },
    "Erro ao abrir câmera": {
        "key": "checkin.errorOpeningCamera",
        "en": "Error opening camera",
        "es": "Error al abrir cámara"
    },
    "Check-ins realizados": {
        "key": "checkin.checkinsPerformed",
        "en": "Check-ins performed",
        "es": "Check-ins realizados"
    },
    "Total de ingressos": {
        "key": "checkin.totalTickets",
        "en": "Total tickets",
        "es": "Total de entradas"
    },
    "Scanner": {
        "key": "checkin.scanner",
        "en": "Scanner",
        "es": "Scanner"
    },
    "Listas de Acesso": {
        "key": "checkin.accessLists",
        "en": "Access Lists",
        "es": "Listas de Acceso"
    },
    " Abrir câmera para scanner\n                  ": {
        "key": "checkin.openCameraForScanner",
        "en": " Open camera for scanner\n                  ",
        "es": " Abrir cámara para scanner\n                  "
    },
    " Parar scanner\n                  ": {
        "key": "checkin.stopScanner",
        "en": " Stop scanner\n                  ",
        "es": " Detener scanner\n                  "
    },
    "Buscar por nome, email ou código...": {
        "key": "checkin.searchByNameEmailOrCode",
        "en": "Search by name, email or code...",
        "es": "Buscar por nombre, correo o código..."
    },
    " · #": {
        "key": "common.bulletNumberPrefix",
        "en": " · #",
        "es": " · #"
    },
    "Entrou": {
        "key": "checkin.entered",
        "en": "Entered",
        "es": "Ingresó"
    },
    "Pagamento pendente": {
        "key": "checkin.pendingPayment",
        "en": "Pending payment",
        "es": "Pago pendiente"
    },
    "\n                          Check-in\n                        ": {
        "key": "checkin.checkinAction",
        "en": "\n                          Check-in\n                        ",
        "es": "\n                          Check-in\n                        "
    },
    "Nenhum ingresso encontrado.": {
        "key": "checkin.noTicketsFound",
        "en": "No tickets found.",
        "es": "Ninguna entrada encontrada."
    },
    "Cupom criado!": {
        "key": "coupons.couponCreated",
        "en": "Coupon created!",
        "es": "¡Cupón creado!"
    },
    "Cupom removido.": {
        "key": "coupons.couponRemoved",
        "en": "Coupon removed.",
        "es": "Cupón removido."
    },
    "Cupons — ": {
        "key": "coupons.coupons",
        "en": "Coupons — ",
        "es": "Cupones — "
    },
    "Criar cupom": {
        "key": "coupons.createCoupon",
        "en": "Create coupon",
        "es": "Crear cupón"
    },
    "Código *": {
        "key": "forms.codeRequired",
        "en": "Code *",
        "es": "Código *"
    },
    "EX: DESCONTO20": {
        "key": "coupons.codeExample",
        "en": "EX: DISCOUNT20",
        "es": "EJ: DESCUENTO20"
    },
    "Tipo de desconto": {
        "key": "coupons.discountType",
        "en": "Discount type",
        "es": "Tipo de descuento"
    },
    "Porcentagem (%)": {
        "key": "coupons.percentage",
        "en": "Percentage (%)",
        "es": "Porcentaje (%)"
    },
    "Valor fixo (R$)": {
        "key": "coupons.fixedAmount",
        "en": "Fixed amount (R$)",
        "es": "Valor fijo (R$)"
    },
    "Valor do desconto": {
        "key": "coupons.discountValue",
        "en": "Discount value",
        "es": "Valor del descuento"
    },
    "Limite de usos": {
        "key": "coupons.usageLimit",
        "en": "Usage limit",
        "es": "Límite de usos"
    },
    "Válido a partir de": {
        "key": "coupons.validFrom",
        "en": "Valid from",
        "es": "Válido desde"
    },
    "Válido até": {
        "key": "coupons.validUntil",
        "en": "Valid until",
        "es": "Válido hasta"
    },
    "Valor mínimo do pedido (R$)": {
        "key": "coupons.minimumOrderValue",
        "en": "Minimum order value (R$)",
        "es": "Valor mínimo del pedido (R$)"
    },
    "Ingressos aplicáveis (vazio = todos)": {
        "key": "coupons.applicableTickets",
        "en": "Applicable tickets (empty = all)",
        "es": "Entradas aplicables (vacío = todas)"
    },
    "Nenhum cupom criado.": {
        "key": "coupons.noCouponsCreated",
        "en": "No coupons created.",
        "es": "Ningún cupón creado."
    },
    "Código": {
        "key": "common.code",
        "en": "Code",
        "es": "Código"
    },
    "Usos": {
        "key": "common.uses",
        "en": "Uses",
        "es": "Usos"
    },
    "Remover cupom?": {
        "key": "coupons.removeCouponQuestion",
        "en": "Remove coupon?",
        "es": "¿Remover cupón?"
    },
    "\n                                O cupom ": {
        "key": "coupons.couponRemovalPrefix",
        "en": "\n                                The coupon ",
        "es": "\n                                El cupón "
    },
    " será removido permanentemente.\n                              ": {
        "key": "coupons.willBePermanentlyRemoved",
        "en": " will be permanently removed.\n                              ",
        "es": " será removido permanentemente.\n                              "
    },
    "Remover": {
        "key": "common.remove",
        "en": "Remove",
        "es": "Remover"
    },
    "\n          Última atualização: ": {
        "key": "common.lastUpdated",
        "en": "\n          Last updated: ",
        "es": "\n          Última actualización: "
    },
    "\n            Contagem regressiva: ": {
        "key": "common.countdown",
        "en": "\n            Countdown: ",
        "es": "\n            Cuenta regresiva: "
    },
    "Vendas Líquidas": {
        "key": "reports.netSales",
        "en": "Net Sales",
        "es": "Ventas Líquidas"
    },
    "Ingressos Aprovados": {
        "key": "reports.approvedTickets",
        "en": "Approved Tickets",
        "es": "Entradas Aprobadas"
    },
    " gratuitos e ": {
        "key": "reports.freeAnd",
        "en": " free and ",
        "es": " gratuitas y "
    },
    " pagos": {
        "key": "reports.paidPlural",
        "en": " paid",
        "es": " pagas"
    },
    "Taxa de Comparecimento": {
        "key": "reports.attendanceRate",
        "en": "Attendance Rate",
        "es": "Tasa de Asistencia"
    },
    " check-ins": {
        "key": "reports.checkins",
        "en": " check-ins",
        "es": " check-ins"
    },
    "No-shows": {
        "key": "reports.noShows",
        "en": "No-shows",
        "es": "No-shows"
    },
    "Taxa de Ocupação": {
        "key": "reports.occupancyRate",
        "en": "Occupancy Rate",
        "es": "Tasa de Ocupación"
    },
    " ingressos": {
        "key": "reports.ticketsSuffix",
        "en": " tickets",
        "es": " entradas"
    },
    "Capacidade não definida": {
        "key": "reports.capacityNotDefined",
        "en": "Capacity not defined",
        "es": "Capacidad no definida"
    },
    "Não encontramos dados neste filtro.": {
        "key": "reports.noDataInFilter",
        "en": "We found no data in this filter.",
        "es": "No encontramos datos en este filtro."
    },
    "Não encontramos métodos de pagamento neste filtro.": {
        "key": "reports.noPaymentMethodsInFilter",
        "en": "We found no payment methods in this filter.",
        "es": "No encontramos métodos de pago en este filtro."
    },
    "Vendas com e sem código promocional": {
        "key": "reports.salesWithAndWithoutPromoCode",
        "en": "Sales with and without promotional code",
        "es": "Ventas con y sin código promocional"
    },
    "Sem cupom: ": {
        "key": "reports.withoutCoupon",
        "en": "Without coupon: ",
        "es": "Sin cupón: "
    },
    "Com cupom: ": {
        "key": "reports.withCoupon",
        "en": "With coupon: ",
        "es": "Con cupón: "
    },
    "Não encontramos dados de códigos promocionais.": {
        "key": "reports.noPromoCodeData",
        "en": "We found no promotional code data.",
        "es": "No encontramos datos de códigos promocionales."
    },
    "No-show por lote": {
        "key": "reports.noShowByBatch",
        "en": "No-show by batch",
        "es": "No-show por lote"
    },
    "Lote": {
        "key": "common.batch",
        "en": "Batch",
        "es": "Lote"
    },
    "Detalhamento por ingresso": {
        "key": "reports.ticketBreakdown",
        "en": "Ticket breakdown",
        "es": "Detalle por entrada"
    },
    "Vendidos/Total": {
        "key": "reports.soldTotal",
        "en": "Sold/Total",
        "es": "Vendidas/Total"
    },
    "Aprovado": {
        "key": "common.approved",
        "en": "Approved",
        "es": "Aprobado"
    },
})

# Script execution
import json

with open('tmp/batches/batch-3.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

output = {
    "batchIndex": 3,
    "translations": {}
}

for item in data:
    original = item["original"]
    if original in MAPPING:
        mapped = MAPPING[original]
        output["translations"][original] = {
            "key": mapped["key"],
            "pt": original,
            "en": mapped["en"],
            "es": mapped["es"]
        }
    else:
        # Fallback: generate a generic key and keep original for all
        key = "common." + "".join(c for c in original.strip().lower().replace(" ", "_") if c.isalnum() or c == "_")[:40]
        output["translations"][original] = {
            "key": key,
            "pt": original,
            "en": original,
            "es": original
        }

import os
os.makedirs('tmp/translations', exist_ok=True)

with open('tmp/translations/batch-3-translated.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("Done. Generated tmp/translations/batch-3-translated.json")
