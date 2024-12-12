import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Question } from "./Question";
import { Form } from "./Form";

@Entity({
    name: 'template',
    schema: 'dbo'
})
export class Template {
    @PrimaryGeneratedColumn()
    template_id!: number;

    @Column('text')
    template_name!: string;

    @Column('text')
    creator!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;

    @OneToMany(() => Question, question => question.template)
    questions!: Question[]

    @RelationId((template: Template) => template.questions)
    questionIds!: number[]

    @OneToMany(() => Form, form => form.template)
    forms!: Form[]

    @RelationId((template: Template) => template.forms)
    formIds!: number[]
}
