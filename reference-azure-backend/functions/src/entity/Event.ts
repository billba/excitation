import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
    name: 'event',
    schema: 'dbo'
})
export class Event {
    @PrimaryGeneratedColumn()
    event_id!: number;

    @Column('simple-json')
    body!: JSON;

    @CreateDateColumn()
    createdAt!: Date;
}
