import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SensorsIncomingEvents, SensorsOutgoingEvents } from '../enums';
import { SensorsService } from '../services';

@WebSocketGateway()
export class SensorsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly _sensorsService: SensorsService;
  private readonly _logger = new Logger(SensorsGateway.name);
  @WebSocketServer() private readonly _wsServer: Server;
  private _clients: Socket[] = [];

  constructor(
    @Inject(forwardRef(() => SensorsService))
    sensorsService: SensorsService,
  ) {
    this._sensorsService = sensorsService;
  }
  /**
   * Right after the connection is established, this method is called.
   * @param client Is the socket client that is connected to the gateway.
   * @returns The list of active temperature sensors.
   */
  async handleConnection(client: Socket) {
    this._logger.log(
      `Client with ws id: ${client.id} connected to the ${SensorsGateway.name} gateway`,
    );

    this._clients.push(client);

    const registeredSensors = await this._sensorsService.getSystemSensors();
    client.emit(SensorsOutgoingEvents.SYSTEM_REGISTERED_SENSORS, {
      data: registeredSensors,
    });
  }

  /**
   * This method is called when the gateway is disconnected.
   * @param client Is the socket client that is disconnected from the gateway.
   */
  handleDisconnect(client: Socket) {
    this._logger.log(
      `Client with ws id: ${client.id} disconnected from the ${SensorsGateway.name} gateway`,
    );
    this._clients = this._clients.filter((c) => c.id !== client.id);
  }
  /**
   * This method is called when the gateway is initialized.
   */
  afterInit() {
    this._logger.log('Sensors websocket server initialized');
  }

  /**
   * After receiving a message from the client, this method emits a message to the client
   * with the registered sensors.
   * @param client Is the socket client that is sending the message.
   */
  @SubscribeMessage(SensorsIncomingEvents.SYSTEM_REGISTERED_SENSORS)
  async handleMessage(client: Socket): Promise<void> {
    const registeredSensors = await this._sensorsService.getSystemSensors();
    client.emit(SensorsOutgoingEvents.SYSTEM_REGISTERED_SENSORS, {
      data: registeredSensors,
    });
  }

  /**
   * Emits a message to all the clients connected to the namespace temperature.
   * @param event Is the event that is emitted by the temperature sensor service
   * @param data Is the data that will be emitted to all the clients connected to the gateway
   */
  emitMessage(event: string, data: any) {
    this._wsServer.emit(event, data);
  }
}
