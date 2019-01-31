
class FormBind {

   constructor(){
      this.form = ''
      this.row = typeof sessionStorage.getItem('row') !='undefined' && JSON.parse(sessionStorage.getItem('row'))
      this.viewModel = new Example1ViewModel()
   }

   init(divId){

      this.form = '#'+divId
      if( this.row !=null){
         this.onCB() //run 'onCB' only when there was a click on the row in the table, other way no data needed in the form
      }
   }

   add(row) {
      console.info("--row:", row)
      let validation = this.viewModel.valid(row) //do the validation
      console.info("--validation:", validation)

      if(validation=='OK')
         this.viewModel.add(row)
      else  {
         console.info('error', validation)
      } //else
   }

   update(row) {
      let validation = this.viewModel.valid(row) //do the validation

      if(validation=='OK')
         this.viewModel.update(row)
      else  {
         console.info('error', validation)
      } //else
   }

   delete(row) {
      this.viewModel.delete(row)
   }

   onCB() {
      let _this = this

      $(_this.form).find('input[name="col1"]').val(this.row['col1'])
      $(_this.form).find('input[name="col2"]').val(this.row['col2'])
      $(_this.form).find('input[name="id"]').val(this.row['id'])
   }


   getFields() {
      let lst = {}
      //start w/ pk
      let input = $(this.form+' [name="id"]')
      lst['id'] = input.val()

      $(this.form+' input').each(
         function(index){
            let input = $(this)
            lst[ input.attr('name')] = input.val()
         }//index
      )//each
      console.info('--lst',lst)
      return lst
   }//()


   clearFields(){
      sessionStorage.removeItem('row');
      $(this.form).find('input').val('')
   }
}